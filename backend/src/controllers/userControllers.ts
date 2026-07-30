
// import database client
import  prisma from '../lib/prisma';
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import crypto from 'crypto';
import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as commonPackage from "@zxcvbn-ts/language-common";
import { AppError } from '../middleware/errorHandler';
import { sendEmail } from '../services/emailService';
import path from 'path'
import { EDITABLE_PROFILE_FIELDS, USER_ROLES, canMutateProfileField, getProfileMutationPermissions, type EditableProfileField, type UserRoleName } from '../util/userProfileAuthorization';
import { validateSafetyHubAgreementCompletion } from '../util/agreementCompletion';
import { canChangeRole } from '../util/agreementEligibility';
import { directoryTargetRoles } from '../middleware/resourceAuthorization';
import { UserRole } from '@prisma/client';
import { normalizeAcademicAffiliations, type AcademicAffiliationInput } from '../util/academicAffiliations';

type User = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    verificationToken: string;
    academicAffiliations: AcademicAffiliationInput[];
}

type CertificationsByLab = {
    labId: string;
    labName: string;
    certifications: {}[];
};

type PasswordValidationResult = {
  valid: boolean;
  errors: string[];
};


dotenv.config({
    path: path.resolve(process.cwd(), '../.env')
});

const options = {
  dictionary: {
    ...commonPackage.dictionary,
  },
  graphs: commonPackage.adjacencyGraphs,
};

const VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;
const PASSWORD_RESET_TOKEN_TTL_MS = 1000 * 60 * 30;

const getFrontendBaseUrl = () => {
    return (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const hashToken = (token: string) =>
    crypto.createHash('sha256').update(token).digest('hex');

const getVerifiedEmailRecord = async (email: string) => {
    return prisma.emailVerificationToken.findFirst({
        where: {
            email,
            verifiedAt: { not: null },
        },
    });
};

const requireVerifiedEmail = async (email: string, requestToken: string) => {
    const credentialHash = requestToken ? hashToken(requestToken) : '';
    const verifiedEmail = requestToken ? await prisma.emailVerificationToken.findFirst({
        where: { email: normalizeEmail(email), purpose: 'SIGNUP', OR: [{ requestTokenHash: credentialHash }, { tokenHash: credentialHash }], verifiedAt: { not: null }, expiresAt: { gt: new Date() } },
    }) : null;

    if (!verifiedEmail) {
        throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Please verify your email before creating an account');
    }

    return verifiedEmail;
};

const sendVerificationEmail = async (email: string) => {
    const normalizedEmail = normalizeEmail(email);

    const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
    });

    if (existingUser) {
        throw new AppError(409, 'USER_EXISTS', 'A user with this email already exists');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const requestToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const requestTokenHash = hashToken(requestToken);
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
    const verificationUrl = `${getFrontendBaseUrl()}/verify-email?token=${rawToken}`;

    await prisma.emailVerificationToken.upsert({
        where: { email: normalizedEmail },
        update: {
            tokenHash,
            requestTokenHash,
            expiresAt,
            verifiedAt: null,
            purpose: 'SIGNUP',
            userId: null,
        },
        create: {
            email: normalizedEmail,
            tokenHash,
            requestTokenHash,
            expiresAt,
            purpose: 'SIGNUP',
        },
    });

    const emailSubject = 'Verify your SafetyHub email';
    const emailText = `Verify your email by opening this link: ${verificationUrl}`;
    const emailHtml = `
      <h2>SafetyHub</h2>
      <p>Click the link below to verify your email address.</p>
      <p><a href="${verificationUrl}">Verify email</a></p>
    `;

    const result = await sendEmail({
        to: normalizedEmail,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
    });

    return {
        email: normalizedEmail,
        message: 'Verification email sent successfully',
        previewUrl: result.previewUrl,
        requestToken,
    };
};

const getEmailVerificationStatus = async (requestToken: string) => {
    const record = await prisma.emailVerificationToken.findUnique({
        where: { requestTokenHash: hashToken(requestToken) },
    });
    if (!record || record.expiresAt.getTime() < Date.now()) {
        throw new AppError(400, 'VERIFICATION_EXPIRED', 'This verification request is invalid or expired');
    }
    return { verified: Boolean(record.verifiedAt), email: record.verifiedAt ? record.email : undefined };
};
const verifyEmailAddress = async (token: string) => {
    const tokenHash = hashToken(token);
    const verificationRecord = await prisma.emailVerificationToken.findUnique({
        where: { tokenHash },
    });

    if (!verificationRecord) {
        throw new AppError(400, 'INVALID_VERIFICATION_TOKEN', 'Verification link is invalid or expired');
    }
    if (verificationRecord.purpose !== 'SIGNUP') {
        throw new AppError(400, 'INVALID_VERIFICATION_PURPOSE', 'This link cannot be used to create an account');
    }

    if (verificationRecord.expiresAt.getTime() < Date.now()) {
        await prisma.emailVerificationToken.delete({
            where: { tokenHash },
        });

        throw new AppError(400, 'VERIFICATION_EXPIRED', 'Verification link has expired');
    }

    const updatedRecord = verificationRecord.verifiedAt
        ? verificationRecord
        : await prisma.emailVerificationToken.update({
            where: { tokenHash },
            data: { verifiedAt: new Date() },
        });

    return {
        email: updatedRecord.email,
        message: 'Email verified successfully',
    };
};

const sendPasswordResetEmail = async (email: string) => {
    const normalizedEmail = normalizeEmail(email);
    const rawToken = crypto.randomBytes(32).toString('hex');
    const requestToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

    await prisma.passwordResetToken.deleteMany({ where: { email: normalizedEmail } });
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    await prisma.passwordResetToken.create({
        data: { email: normalizedEmail, tokenHash: hashToken(rawToken), requestTokenHash: hashToken(requestToken), expiresAt },
    });
    if (user) {
        const resetUrl = `${getFrontendBaseUrl()}/verify-email?purpose=reset&token=${rawToken}`;
        await sendEmail({
            to: normalizedEmail,
            subject: 'Reset your SafetyHub password',
            text: `Reset your password by opening this link: ${resetUrl}`,
            html: `<h2>SafetyHub</h2><p>We received a request to reset your password.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 30 minutes.</p>`,
        });
    }
    return { requestToken, message: 'If an account exists for that email, a reset link has been sent.' };
};

const verifyPasswordReset = async (token: string) => {
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!record || record.expiresAt.getTime() < Date.now()) {
        throw new AppError(400, 'PASSWORD_RESET_EXPIRED', 'This password reset link is invalid or expired');
    }
    if (!record.verifiedAt) {
        await prisma.passwordResetToken.update({ where: { id: record.id }, data: { verifiedAt: new Date() } });
    }
    return { email: record.email };
};

const getPasswordResetStatus = async (requestToken: string) => {
    const record = await prisma.passwordResetToken.findUnique({ where: { requestTokenHash: hashToken(requestToken) } });
    if (!record || record.expiresAt.getTime() < Date.now()) {
        throw new AppError(400, 'PASSWORD_RESET_EXPIRED', 'This password reset request is invalid or expired');
    }
    return { verified: Boolean(record.verifiedAt) };
};

const resetPassword = async (credential: string, password: string) => {
    const credentialHash = hashToken(credential);
    const record = await prisma.passwordResetToken.findFirst({
        where: { OR: [{ tokenHash: credentialHash }, { requestTokenHash: credentialHash }] },
    });
    if (!record || !record.verifiedAt || record.expiresAt.getTime() < Date.now()) {
        throw new AppError(400, 'PASSWORD_RESET_NOT_VERIFIED', 'Verify your reset link before choosing a new password');
    }
    const strength = checkPasswordStrength(password, [record.email]);
    if (!strength.valid) throw new AppError(400, 'WEAK_PASSWORD', 'Password does not meet strength requirements');
    await prisma.$transaction([
        prisma.user.update({ where: { email: record.email }, data: { passwordHash: await bcrypt.hash(password, 10) } }),
        prisma.passwordResetToken.deleteMany({ where: { email: record.email } }),
    ]);
};

const getUserDataById = async (id: string) => {
    try {
    // fetch from db
        const userData = await prisma.user.findUnique({
        where: {
            id: id
        },
        select: {
            firstName: true,
            lastName: true,
            userAgreementSource: true,
            isUserAgreementComplete: true,
            email: true,
            role: true,
            id: true
        }
        });

    return userData;
    } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
    }
};

const getUserProfileById = async (id: string) => {
    try {
        const userData = await prisma.user.findUnique({
            where: {
                id: id
            },
            select: {
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                id: true,
                createdAt: true,
                userAgreementSource: true,
                userAgreementCompletedAt: true,
                userAgreementSignature: true,
                userAgreementAcknowledgements: true,
                isUserAgreementComplete: true,
                graduationYear: true,
                jobTitle: true,
                department: true,
                phoneNumber: true,
                address: true,
                isActive: true,
                academicAffiliations: {
                    select: { collegeId: true, departmentId: true },
                },
            }
        });

        const certifications = await prisma.certification.findMany({
            where: {
                issuedToId: id
            },
            include: {
                issuedBy: {
                    select:{
                        id: true,
                        firstName: true,
                        lastName: true
                    } 
                },
                trainingNode: {
                include: {
                    lab: {
                        select: {
                            id: true,
                            name: true,
                        }
                    },
                },
                },
            },
            orderBy: {
                issuedAt: "desc",
            },
        });
        console.log("CERTS",certifications)


        const certsGroupedByLab = certifications.reduce<CertificationsByLab[]>(
            (acc, cert) => {
                const lab = cert.trainingNode.lab;

                let existingLabGroup = acc.find(
                    (group) => group.labId === lab.id
                );
      
                if (!existingLabGroup) {
                    existingLabGroup = {
                        labId: lab.id,
                        labName: lab.name,
                        certifications: [],
                    };

                    acc.push(existingLabGroup);
                }

                existingLabGroup.certifications.push(cert);

                return acc;
            },
            []
        );
            
            
        const userProfileData = {
            ...userData,
            certsGroupedByLab
        }
        return userProfileData
        
    } catch (error) {
        console.error("Error fetching user profile data:", error);
        throw error;
    }
}

const getTabularUsers = async (
    page: number,
    pageSize: number,
    filters: {
      search: string;
      role?: string;
      agreementComplete?: boolean;
      agreementSource?: string;
      isActive?: boolean;
    },
    actorRole: UserRoleName,
) => {
    try {
        const skip = (page - 1) * pageSize;
        const searchWhere = filters.search
          ? {
              OR: [
                { email: { contains: filters.search, mode: "insensitive" as const } },
                { fullName: { contains: filters.search, mode: "insensitive" as const } },
              ],
            }
          : {};
        const targetRoles = directoryTargetRoles(actorRole as UserRole);
        const requestedRole = (USER_ROLES as readonly string[]).includes(filters.role ?? '')
          ? filters.role as UserRoleName
          : undefined;
        const where = {
          AND: [
            ...(targetRoles ? [{ role: { in: targetRoles } }] : []),
            ...(requestedRole ? [{ role: requestedRole }] : []),
            ...(filters.agreementComplete !== undefined
              ? [{ isUserAgreementComplete: filters.agreementComplete }]
              : []),
            ...(filters.isActive !== undefined ? [{ isActive: filters.isActive }] : []),
            ...(filters.agreementSource === 'NONE'
              ? [{ userAgreementSource: null }]
              : filters.agreementSource
                ? [{ userAgreementSource: filters.agreementSource }]
                : []),
            searchWhere,
          ],
        };
        const [users, totalRows] = await prisma.$transaction([
          prisma.user.findMany({
            skip,
            take: pageSize,
            where,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                fullName: true,
                role: true,
                isUserAgreementComplete: true,
                userAgreementSource: true,
                createdAt: true,
                isActive: true
            },
            orderBy: {
                createdAt: 'desc',
            }
          }),
          prisma.user.count({ where }),
        ]);
        return { users, totalRows };
    } catch (error) {
        console.error("Error fetching tabular users:", error);
        throw error;
    }
}


const getUserNameDatabyId = async (id: string) => {
    try {
    // fetch from db
    const userData = await prisma.user.findUnique({
        where: {
            id: id
        },
        select: {
            firstName: true,
            lastName: true
        },
    });
    return userData;
    } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
    }
};

type ProfileUpdateInput = Partial<Record<EditableProfileField, unknown>>;

const updateUserProfile = async (actorId: string, targetId: string, input: ProfileUpdateInput) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new AppError(400, 'INVALID_PROFILE_UPDATE', 'Profile update must be an object');
    }
    const fields = Object.keys(input);
    const unsupported = fields.filter((field) => !(EDITABLE_PROFILE_FIELDS as readonly string[]).includes(field));
    if (unsupported.length) throw new AppError(400, 'UNSUPPORTED_PROFILE_FIELDS', `Unsupported profile fields: ${unsupported.join(', ')}`);
    if (!fields.length) throw new AppError(400, 'EMPTY_PROFILE_UPDATE', 'Provide at least one profile field to update');

    const [actor, target] = await Promise.all([
        prisma.user.findUnique({ where: { id: actorId }, select: { id: true, role: true } }),
        prisma.user.findUnique({ where: { id: targetId }, select: { id: true, role: true, isUserAgreementComplete: true } }),
    ]);
    if (!actor) throw new AppError(401, 'ACTOR_NOT_FOUND', 'Authenticated user no longer exists');
    if (!target) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');

    const permissions = getProfileMutationPermissions(
        { id: actor.id, role: actor.role as UserRoleName },
        { id: target.id, role: target.role as UserRoleName },
    );
    for (const field of fields as EditableProfileField[]) {
        if (!canMutateProfileField(permissions, field)) throw new AppError(403, 'PROFILE_FIELD_FORBIDDEN', `You are not authorized to change ${field}`);
    }

    const data: Record<string, string | number | boolean | null> = {};
    let academicAffiliations: ReturnType<typeof normalizeAcademicAffiliations> | undefined;
    for (const field of fields as EditableProfileField[]) {
        const value = input[field];
        if (field === 'academicAffiliations') {
            academicAffiliations = normalizeAcademicAffiliations(value);
        } else if (field === 'role') {
            if (typeof value !== 'string' || !(USER_ROLES as readonly string[]).includes(value)) throw new AppError(400, 'INVALID_ROLE', 'Role is invalid');
            if (!permissions.assignableRoles.includes(value as UserRoleName)) throw new AppError(403, 'ROLE_ASSIGNMENT_FORBIDDEN', `You cannot assign the ${value} role`);
            if (!canChangeRole(target.role, value, target.isUserAgreementComplete)) {
                throw new AppError(409, 'USER_AGREEMENT_REQUIRED', 'This user must complete the user agreement before their role can be changed');
            }
            data.role = value;
        } else if (field === 'isActive') {
            if (typeof value !== 'boolean') throw new AppError(400, 'INVALID_BOOLEAN', `${field} must be a boolean`);
            data[field] = value;
        } else if (field === 'graduationYear') {
            const maxYear = new Date().getFullYear() + 10;
            if (value !== null && (typeof value !== 'number' || !Number.isInteger(value) || value < 1900 || value > maxYear)) throw new AppError(400, 'INVALID_GRADUATION_YEAR', `Graduation year must be between 1900 and ${maxYear}`);
            data.graduationYear = value;
        } else {
            if (value !== null && typeof value !== 'string') throw new AppError(400, 'INVALID_PROFILE_VALUE', `${field} must be a string or null`);
            const normalized = typeof value === 'string' ? value.trim() : null;
            if (['firstName', 'lastName'].includes(field) && !normalized) throw new AppError(400, 'REQUIRED_IDENTITY_FIELD', `${field} cannot be empty`);
            data[field] = normalized;
        }
    }
    if (academicAffiliations) {
        const departments = await prisma.department.findMany({
            where: {
                id: { in: academicAffiliations.map((entry) => entry.departmentId) },
                isActive: true,
                college: { isActive: true },
            },
            select: { id: true, collegeId: true },
        });
        const departmentById = new Map(departments.map((department) => [department.id, department]));
        if (
            departments.length !== academicAffiliations.length
            || academicAffiliations.some((entry) => departmentById.get(entry.departmentId)?.collegeId !== entry.collegeId)
        ) {
            throw new AppError(400, 'INVALID_ACADEMIC_AFFILIATION', 'One or more selected departments do not belong to the selected active colleges.');
        }
    }
    const updated = await prisma.$transaction(async (tx) => {
        if (academicAffiliations) {
            await tx.userAcademicAffiliation.deleteMany({ where: { userId: targetId } });
        }
        return tx.user.update({
            where: { id: targetId },
            data: {
                ...data,
                ...(academicAffiliations ? {
                    academicAffiliations: {
                        create: academicAffiliations.map((entry) => ({
                            collegeId: entry.collegeId,
                            departmentId: entry.departmentId,
                        })),
                    },
                } : {}),
            },
            select: {
                id: true, firstName: true, lastName: true, email: true, role: true, graduationYear: true,
                jobTitle: true, department: true, phoneNumber: true, address: true, isActive: true,
                isUserAgreementComplete: true, userAgreementSource: true, userAgreementCompletedAt: true,
                userAgreementSignature: true, userAgreementAcknowledgements: true,
                academicAffiliations: { select: { collegeId: true, departmentId: true } },
            },
        });
    });
    return updated;
};

const sendEmailChangeVerification = async (userId: string, emailValue: unknown) => {
    const email = typeof emailValue === 'string' ? normalizeEmail(emailValue) : '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError(400, 'INVALID_EMAIL', 'Enter a valid email address');
    }
    const [user, duplicate] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } }),
        prisma.user.findUnique({ where: { email }, select: { id: true } }),
    ]);
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    if (email === user.email) throw new AppError(400, 'EMAIL_UNCHANGED', 'Enter a different email address');
    if (duplicate) throw new AppError(409, 'EMAIL_IN_USE', 'A user with this email already exists');

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
    const verificationUrl = `${getFrontendBaseUrl()}/verify-email?purpose=email-change&token=${rawToken}`;
    await prisma.emailVerificationToken.upsert({
        where: { email },
        update: { tokenHash, requestTokenHash: null, verifiedAt: null, expiresAt, purpose: 'EMAIL_CHANGE', userId },
        create: { email, tokenHash, expiresAt, purpose: 'EMAIL_CHANGE', userId },
    });
    const result = await sendEmail({
        to: email,
        subject: 'Verify your new SafetyHub email',
        text: `Confirm your new email address by opening this link: ${verificationUrl}`,
        html: `<h2>SafetyHub</h2><p>Confirm this email address for your account.</p><p><a href="${verificationUrl}">Verify new email</a></p>`,
    });
    return { email, previewUrl: result.previewUrl };
};

const confirmEmailChange = async (token: string) => {
    const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!record || record.purpose !== 'EMAIL_CHANGE' || !record.userId || record.expiresAt.getTime() < Date.now()) {
        throw new AppError(400, 'EMAIL_CHANGE_EXPIRED', 'This email-change link is invalid or expired');
    }
    const userId = record.userId;
    const duplicate = await prisma.user.findUnique({ where: { email: record.email }, select: { id: true } });
    if (duplicate && duplicate.id !== userId) throw new AppError(409, 'EMAIL_IN_USE', 'A user with this email already exists');
    const user = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
            where: { id: userId },
            data: { email: record.email },
            select: { id: true, email: true },
        });
        // Verification can be submitted more than once (for example, React
        // StrictMode may run the confirmation effect twice). Consuming an
        // already-consumed token must not roll back the successful email update.
        await tx.emailVerificationToken.deleteMany({ where: { id: record.id } });
        return updated;
    });
    return user;
};

const completeUserAgreement = async (actorId: string, targetId: string, input: unknown) => {
    if (actorId !== targetId) {
        throw new AppError(403, 'AGREEMENT_COMPLETION_FORBIDDEN', 'Users may only sign their own agreement');
    }

    const { signatureName, signedDate, acknowledgedLinkIds } = validateSafetyHubAgreementCompletion(input);
    const agreementLinks = await prisma.agreementLink.findMany({ orderBy: { createdAt: 'asc' } });
    const requiredIds = new Set(agreementLinks.map((link) => link.id));
    const submittedIds = new Set(acknowledgedLinkIds);
    if (requiredIds.size !== submittedIds.size || [...requiredIds].some((id) => !submittedIds.has(id))) {
        throw new AppError(400, 'AGREEMENT_ACKNOWLEDGEMENTS_REQUIRED', 'Every agreement must be acknowledged before completion');
    }

    return prisma.user.update({
        where: { id: targetId },
        data: {
            isUserAgreementComplete: true,
            userAgreementSource: 'Safety Hub',
            userAgreementCompletedAt: signedDate,
            userAgreementSignature: signatureName,
            userAgreementAcknowledgements: agreementLinks.map((link) => ({
                id: link.id,
                title: link.title,
                url: link.url,
                displayText: link.displayText,
            })),
        },
        select: {
            id: true,
            isUserAgreementComplete: true,
            userAgreementSource: true,
            userAgreementCompletedAt: true,
            userAgreementSignature: true,
            userAgreementAcknowledgements: true,
        },
    });
};

const sendUserAgreementReminder = async (actorId: string, targetId: string) => {
    if (actorId === targetId) {
        throw new AppError(400, 'AGREEMENT_REMINDER_SELF_FORBIDDEN', 'You cannot send an agreement reminder to yourself');
    }

    const target = await prisma.user.findUnique({
        where: { id: targetId },
        select: { email: true, firstName: true, isUserAgreementComplete: true },
    });
    if (!target) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    if (target.isUserAgreementComplete) {
        throw new AppError(400, 'AGREEMENT_ALREADY_COMPLETE', 'This user has already completed the agreement');
    }

    const profileUrl = `${getFrontendBaseUrl()}/user/${targetId}`;
    await sendEmail({
        to: target.email,
        subject: 'Safety Hub user agreement reminder',
        text: `Hello ${target.firstName}, please complete your BIDC user agreement in Safety Hub: ${profileUrl}`,
        html: `<h2>Safety Hub</h2><p>Hello ${target.firstName},</p><p>Please complete your BIDC user agreement.</p><p><a href="${profileUrl}">Open your Safety Hub profile</a></p>`,
    });

    return { email: target.email };
};

const userSearch = async (query: string) => {
    console.log("Search query:", query);
    const users = await prisma.user.findMany({
    where: {
      role: { in: ["STUDENT", "MENTOR", "SUPERVISOR"] },
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      isUserAgreementComplete: true,
    },
    take: 10,
  });

  return users;
}

function checkPasswordStrength(
  password: string,
  personalWords: string[] = []
) {
    const passwordChecker = new ZxcvbnFactory(options);
    const result = passwordChecker.check(password, personalWords);

  return {
    valid: password.length >= 12 && result.score >= 3,
    score: result.score, // 0–4
    warning: result.feedback.warning,
    suggestions: result.feedback.suggestions,
  };
}

const createUser = async (userData: User) => {
  try {
    const normalizedEmail = normalizeEmail(userData.email);
    await requireVerifiedEmail(normalizedEmail, userData.verificationToken);

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      throw new AppError(
        409,
        "USER_EXISTS",
        "A user with this email already exists"
      );
    }

    const affiliations = normalizeAcademicAffiliations(userData.academicAffiliations);
    const departments = await prisma.department.findMany({
      where: {
        id: { in: affiliations.map((entry) => entry.departmentId) },
                isActive: true,
        college: { isActive: true },
      },
      select: { id: true, collegeId: true },
    });
    const departmentById = new Map(departments.map((department) => [department.id, department]));
    const invalidAffiliation = affiliations.find(
      (entry) => departmentById.get(entry.departmentId)?.collegeId !== entry.collegeId,
    );
    if (invalidAffiliation || departments.length !== affiliations.length) {
      throw new AppError(
        400,
        'INVALID_ACADEMIC_AFFILIATION',
        'One or more selected departments do not belong to the selected active colleges.',
      );
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: normalizedEmail,
          passwordHash: hashedPassword,
          academicAffiliations: {
            create: affiliations.map((entry) => ({
              collegeId: entry.collegeId,
              departmentId: entry.departmentId,
            })),
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });
      await tx.emailVerificationToken.deleteMany({ where: { email: normalizedEmail } });
      return user;
    });

    return createdUser;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      500,
      "USER_CREATION_FAILED",
      "Failed to create user",
    );
  }
};

const login = async (email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({
        where: {
            email: normalizedEmail
        }
    });
    if (!user) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }
    if (!user.isActive) throw new AppError(403, 'ACCOUNT_DEACTIVATED', 'This account has been deactivated. Contact an administrator for help.');
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');    
    }   

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
        throw new AppError(500, 'JWT_SECRET_MISSING', 'JWT secret is not configured');
    }

        let token: string;
        try {
            //Creating jwt token
            token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    role: user.role
                },
                JWT_SECRET,
                { expiresIn: "7d" }
            );
        } catch (err) {
            console.log(err);
            throw new AppError(500, 'TOKEN_CREATION_FAILED', 'Error! Something went wrong.');
        }

    return token;
};


const getUserIdByEmail = async (email: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { email: normalizeEmail(email) },
            select: { id: true }
        });
        if (!user) {
            throw new AppError(404, "USER_NOT_FOUND", `User with email ${email} not found`);
        }
        return user.id;
    } catch (error) {
        console.error("Error fetching user ID by email:", error);
        throw error;
    }
};


const getUserRoleById = async (id: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: { role: true }
        });
        if (!user) {
            throw new AppError(404, "USER_NOT_FOUND", `User with id ${id} not found`);
        }
        return user?.role;
    } catch (error) {
        console.error("Error fetching user role:", error);
        throw error;
    }
}


const validateSignupData = async (userData: { email?: string; password?: string; firstName?: string; lastName?: string; academicAffiliations?: unknown; }) => {
    // Check if a user with the given email already exists
    if (
        !userData.email ||
        !userData.password ||
        !userData.firstName ||
        !userData.lastName
    ) {
    throw new AppError(
      400,
      "INVALID_INPUT",
      "Missing required user data"
    );
  }
  normalizeAcademicAffiliations(userData.academicAffiliations);
    // Check if the email is a Purdue University email
  /*   const emailPattern = /^[a-zA-Z0-9._%+-]+@purdue\.edu$/;
    if (!emailPattern.test(userData.email)) {
        throw new AppError(
            400,
            "INVALID_EMAIL",
            "Email must be a Purdue University email"
        );
    } */

    // Check if password is acceptable (e.g., meets minimum length requirements)
    const passwordStrength = checkPasswordStrength(userData.password, [
      userData.firstName,
      userData.lastName,
      userData.email,
    ]);
    
    if (
      !passwordStrength.valid ||
      passwordStrength.score < 3 ||
      userData.password.length < 12
    ) {
      throw new AppError(
        400,
        "WEAK_PASSWORD",
        "Password does not meet strength requirements"
      );
    }
}


export { AppError, getUserDataById, getUserProfileById, getUserNameDatabyId, createUser, login, userSearch, getTabularUsers, getUserRoleById, getUserIdByEmail, checkPasswordStrength, validateSignupData, sendVerificationEmail, verifyEmailAddress, getEmailVerificationStatus, sendEmailChangeVerification, confirmEmailChange, sendPasswordResetEmail, verifyPasswordReset, getPasswordResetStatus, resetPassword, updateUserProfile, completeUserAgreement, sendUserAgreementReminder };




