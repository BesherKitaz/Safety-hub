import { Prisma, UserRole } from '@prisma/client';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { buildBeforeSnapshotFields } from '../util/certificationHistorySnapshots';
import { canReceiveCertification } from '../util/agreementEligibility';
import {
  normalizeCertificationLevelFilter,
  normalizeCertificationStatusFilter,
} from '../util/managementFilters';
import {
  calculateCertificationExpiryDate,
  dependencyExpirationReason,
  dueDateExpirationReason,
} from '../util/certificationLifecycle';

type DatabaseClient = Prisma.TransactionClient | typeof prisma;

type CertificationStatus = 'ACTIVE' | 'DEACTIVATED' | 'EXPIRED' | 'REVOKED';
type CertificationHistoryAction = 'CREATED' | 'UPDATED' | 'REVOKED' | 'REACTIVATED' | 'RENEWED' | 'EXPIRED' | 'DEACTIVATED';

type CertificationInput = {
  trainingNodeId: string;
  notes?: string;
  level: number;
  issuedToId: string;
  issuedById: string;
  expiryDate?: string | Date | null;
};

type CertificationSummary = {
  trainingNodeId: string;
  level: number;
  status: CertificationStatus;
};

type TrainingNodeSummary = {
  id: string;
  parents: { id: string }[];
  children: { id: string }[];
};

type CertificationPerson = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
} | null;

type CertificationTrainingNode = {
  id: string;
  name: string;
  type: string;
  lab: { id: string; name: string } | null;
  tool: { id: string; name: string } | null;
};

type CertificationSnapshot = {
  id: string;
  trainingNodeId: string;
  notes: string | null;
  status: CertificationStatus;
  level: number;
  expiryDate: Date | null;
  issuedAt: Date;
  issuedTo: CertificationPerson;
  issuedBy: CertificationPerson;
  trainingNode: CertificationTrainingNode;
};


type CertificationHistoryRow = {
  id: string;
  certificationId: string;
  action: CertificationHistoryAction;
  levelBefore: number | null;
  statusBefore: CertificationStatus | null;
  expiryDateBefore: Date | null;
  notesBefore: string | null;
  trainingNodeIdBefore: string | null;
  levelAfter: number;
  statusAfter: CertificationStatus;
  expiryDateAfter: Date | null;
  notesAfter: string | null;
  trainingNodeIdAfter: string;
  reason: string | null;
  changedAt: Date;
  changedBy: CertificationPerson;
  trainingNodeBefore: CertificationTrainingNode | null;
  trainingNodeAfter: CertificationTrainingNode | null;
};

type CertificationHistoryResponse = CertificationHistoryRow & {
  certificationSnapshot: CertificationSnapshot;
};

type CertificationValidationContext = {
  issuerRole: UserRole;
  recipientAgreementComplete: boolean;
  receiverCertifications: CertificationSummary[];
  requestedLevel: number;
  trainingNodeSummary: TrainingNodeSummary;
};

const normalizeOptionalText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizeHistoryReason = (value: unknown) => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new AppError(400, 'INVALID_HISTORY_REASON', 'Change reason must be text.');
  }

  return normalizeOptionalText(value);
};

const normalizeOptionalDate = (value?: string | Date | null) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new AppError(400, 'INVALID_EXPIRY_DATE', 'Expiry date is invalid.');
    }

    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(400, 'INVALID_EXPIRY_DATE', 'Expiry date is invalid.');
  }

  return parsed;
};

const prismaAny = prisma as any;
const DEFAULT_CERTIFICATION_DURATION_DAYS = 365;

// Certification duration is configurable while retaining a safe one-year default.
const getCertificationDurationDays = async (db: DatabaseClient = prisma) => {
  const settings = await (db as any).certificationSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      durationDays: DEFAULT_CERTIFICATION_DURATION_DAYS,
    },
    select: { durationDays: true },
  });
  return settings.durationDays as number;
};

const updateCertificationDurationDays = async (value: unknown) => {
  const durationDays = Number(value);
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 3650) {
    throw new AppError(
      400,
      'INVALID_CERTIFICATION_DURATION',
      'Certification duration must be a whole number between 1 and 3650 days.',
    );
  }

  return prismaAny.certificationSettings.upsert({
    where: { id: 'default' },
    update: { durationDays },
    create: { id: 'default', durationDays },
    select: { durationDays: true, updatedAt: true },
  });
};


// Shared selections keep current and historical certification responses consistent.
const personSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

const trainingNodeSelect = {
  id: true,
  name: true,
  type: true,
  lab: {
    select: {
      id: true,
      name: true,
    },
  },
  tool: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

const certificationDetailSelect = {
  id: true,
  trainingNodeId: true,
  notes: true,
  status: true,
  level: true,
  expiryDate: true,
  issuedAt: true,
  trainingNode: {
    select: trainingNodeSelect,
  },
  issuedTo: {
    select: personSelect,
  },
  issuedBy: {
    select: personSelect,
  },
} as const;

// Raw SQL preserves snapshots even when related live records later change.
const certificationHistorySelectSql = (certificationId: string) => Prisma.sql`
  SELECT
    h."id",
    h."certificationId",
    h."action",
    h."levelBefore",
    h."statusBefore",
    h."expiryDateBefore",
    h."notesBefore",
    h."trainingNodeIdBefore",
    h."levelAfter",
    h."statusAfter",
    h."expiryDateAfter",
    h."notesAfter",
    h."trainingNodeIdAfter",
    h."reason",
    h."changedAt",
    h."changedById",
    u."firstName" AS "changedByFirstName",
    u."lastName" AS "changedByLastName",
    u."email" AS "changedByEmail",
    tnb."id" AS "trainingNodeBeforeId",
    tnb."name" AS "trainingNodeBeforeName",
    tnb."type" AS "trainingNodeBeforeType",
    lnb."id" AS "trainingNodeBeforeLabId",
    lnb."name" AS "trainingNodeBeforeLabName",
    tnbTool."id" AS "trainingNodeBeforeToolId",
    tnbTool."name" AS "trainingNodeBeforeToolName",
    tna."id" AS "trainingNodeAfterId",
    tna."name" AS "trainingNodeAfterName",
    tna."type" AS "trainingNodeAfterType",
    lna."id" AS "trainingNodeAfterLabId",
    lna."name" AS "trainingNodeAfterLabName",
    tnaTool."id" AS "trainingNodeAfterToolId",
    tnaTool."name" AS "trainingNodeAfterToolName"
  FROM "CertificationHistory" h
  LEFT JOIN "User" u ON u."id" = h."changedById"
  LEFT JOIN "TrainingNode" tnb ON tnb."id" = h."trainingNodeIdBefore"
  LEFT JOIN "Lab" lnb ON lnb."id" = tnb."labId"
  LEFT JOIN "Tool" tnbTool ON tnbTool."id" = tnb."toolId"
  LEFT JOIN "TrainingNode" tna ON tna."id" = h."trainingNodeIdAfter"
  LEFT JOIN "Lab" lna ON lna."id" = tna."labId"
  LEFT JOIN "Tool" tnaTool ON tnaTool."id" = tna."toolId"
  WHERE h."certificationId" = ${certificationId}
  ORDER BY h."changedAt" ASC, h."id" ASC
`;

const mapTrainingNodeSnapshot = (row: Record<string, any>, prefix: 'trainingNodeBefore' | 'trainingNodeAfter'): CertificationTrainingNode | null => {
  const id = row[`${prefix}Id`] as string | null;
  const name = row[`${prefix}Name`] as string | null;
  const type = row[`${prefix}Type`] as string | null;

  if (!id || !name || !type) {
    return null;
  }

  return {
    id,
    name,
    type,
    lab: row[`${prefix}LabId`] && row[`${prefix}LabName`]
      ? { id: row[`${prefix}LabId`], name: row[`${prefix}LabName`] }
      : null,
    tool: row[`${prefix}ToolId`] && row[`${prefix}ToolName`]
      ? { id: row[`${prefix}ToolId`], name: row[`${prefix}ToolName`] }
      : null,
  };
};

const mapChangedBy = (row: Record<string, any>): CertificationPerson => {
  if (!row.changedById) {
    return null;
  }

  return {
    id: row.changedById,
    firstName: row.changedByFirstName ?? '',
    lastName: row.changedByLastName ?? '',
    email: row.changedByEmail ?? '',
  };
};

const mapCertificationSnapshot = (certification: any): CertificationSnapshot => ({
  id: certification.id,
  trainingNodeId: certification.trainingNodeId,
  notes: certification.notes,
  status: certification.status,
  level: certification.level,
  expiryDate: certification.expiryDate,
  issuedAt: certification.issuedAt,
  issuedTo: certification.issuedTo,
  issuedBy: certification.issuedBy,
  trainingNode: certification.trainingNode,
});

// Convert denormalized history rows into the nested API response consumed by the UI.
const mapHistoryRow = (row: Record<string, any>, certification: CertificationSnapshot): CertificationHistoryResponse => {
  const trainingNodeBefore = mapTrainingNodeSnapshot(row, 'trainingNodeBefore');
  const trainingNodeAfter = mapTrainingNodeSnapshot(row, 'trainingNodeAfter');

  return {
    id: row.id,
    certificationId: row.certificationId,
    action: row.action,
    levelBefore: row.levelBefore,
    statusBefore: row.statusBefore,
    expiryDateBefore: row.expiryDateBefore,
    notesBefore: row.notesBefore,
    trainingNodeIdBefore: row.trainingNodeIdBefore,
    levelAfter: row.levelAfter,
    statusAfter: row.statusAfter,
    expiryDateAfter: row.expiryDateAfter,
    notesAfter: row.notesAfter,
    trainingNodeIdAfter: row.trainingNodeIdAfter,
    reason: row.reason,
    changedAt: row.changedAt,
    changedBy: mapChangedBy(row),
    trainingNodeBefore,
    trainingNodeAfter,
    certificationSnapshot: {
      id: row.certificationId,
      trainingNodeId: row.trainingNodeIdAfter,
      notes: row.notesAfter,
      status: row.statusAfter,
      level: row.levelAfter,
      expiryDate: row.expiryDateAfter,
      issuedAt: row.changedAt,
      issuedTo: null,
      issuedBy: null,
      trainingNode: trainingNodeAfter ?? certification.trainingNode,
    },
  };
};

const getRecentCertifications = async () => {
  return prisma.certification.findMany({
    orderBy: {
      issuedAt: 'desc',
    },
    where: {
      status: 'ACTIVE',
    },
    take: 4,
    include: {
      trainingNode: {
        select: {
          name: true,
          lab: {
            select: {
              name: true,
            },
          },
        },
      },
      issuedTo: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      issuedBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};


// Build the paginated management table with role, search, status, and date filters.
const getTabularCertifications = async (
  skip: number,
  pageSize: number,
  status: unknown = 'ACTIVE',
  search: string = '',
  level?: unknown,
) => {
  const normalizedStatus = normalizeCertificationStatusFilter(status);
  const normalizedLevel = normalizeCertificationLevelFilter(level);

  search = search.trim();
  const where: Prisma.CertificationWhereInput = search
  ? {
      OR: [
        {
          issuedTo: {
            fullName: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        },
        {
          issuedTo: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          issuedBy: {
            fullName: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        },
        {
          issuedBy: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          trainingNode: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          trainingNode: {
            lab: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
      ],
    }
  : {};
  
  const certifications = await prisma.certification.findMany({
    skip,
    take: pageSize,
    where: {
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
      ...(normalizedLevel ? { level: normalizedLevel } : {}),
      AND: where,
    },
    select: {
      id: true,
      trainingNode: {
        select: {
          id: true,
          name: true,
          lab: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      issuedTo: {
        select: {
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
      issuedBy: {
        select: {
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
      issuedAt: true,
      expiryDate: true,
      status: true,
      level: true,
    },
  });
  const totalRows = await prisma.certification.count({
    where: {
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
      ...(normalizedLevel ? { level: normalizedLevel } : {}),
      AND: where,
    },
  });

  const certificationIds = certifications.map((cert: any) => cert.id);

  const latestHistoryRows = await selectCertificationHistoryRowsForTabular(certificationIds);

  const latestHistoryByCertId = new Map(
    latestHistoryRows.map((history: { certificationId: string; changedAt: Date }) => [history.certificationId, history.changedAt])
  );

  return {
    certifications: certifications.map((cert: any) => ({
      ...cert,
      lastUpdated: latestHistoryByCertId.get(cert.id) ?? cert.issuedAt,
    })),
    totalRows,
  };
};

const selectCertificationHistoryRowsForTabular = async (certificationIds: string[]) => {
  if (certificationIds.length === 0) {
    return [] as { certificationId: string; changedAt: Date }[];
  }

  return (await prisma.$queryRaw(Prisma.sql`
    SELECT DISTINCT ON (h."certificationId")
      h."certificationId",
      h."changedAt"
    FROM "CertificationHistory" h
    WHERE h."certificationId" IN (${Prisma.join(certificationIds)})
    ORDER BY h."certificationId", h."changedAt" DESC, h."id" DESC
  `)) as { certificationId: string; changedAt: Date }[];
};

// Gather all related records needed to validate a proposed certification mutation.
const getCertificationValidationContext = async (
  proposal: CertificationInput,
  excludeCertificationId?: string,
  db: DatabaseClient = prisma
): Promise<CertificationValidationContext> => {
  const issuer = await db.user.findUnique({
    where: {
      id: proposal.issuedById,
    },
    select: {
      role: true,
    },
  });

  const issuerRole = issuer?.role;
  if (!issuerRole) {
    throw new AppError(404, 'ISSUER_NOT_FOUND', 'Actor not found.');
  }

  const recipient = await db.user.findUnique({
    where: {
      id: proposal.issuedToId,
    },
    select: {
      isUserAgreementComplete: true,
    },
  });

  if (!recipient) {
    throw new AppError(404, 'RECIPIENT_NOT_FOUND', 'Certification recipient not found.');
  }

  const receiverCertifications = await db.certification.findMany({
    where: {
      issuedToId: proposal.issuedToId,
      ...(excludeCertificationId
        ? { id: { not: excludeCertificationId } }
        : {}),
    },
    select: {
      trainingNodeId: true,
      level: true,
      status: true,
    },
  });

  const trainingNode = await db.trainingNode.findUnique({
    where: {
      id: proposal.trainingNodeId,
    },
    select: {
      id: true,
      parentEdges: {
        select: {
          parentId: true,
        },
      },
      childEdges: {
        select: {
          childId: true,
        },
      },
    },
  });

  if (!trainingNode) {
    throw new AppError(404, 'TRAINING_NODE_NOT_FOUND', 'Training node not found.');
  }

  return {
    issuerRole,
    recipientAgreementComplete: recipient.isUserAgreementComplete,
    receiverCertifications,
    requestedLevel: proposal.level,
    trainingNodeSummary: {
      id: trainingNode.id,
      parents: trainingNode.parentEdges.map((edge) => ({ id: edge.parentId })),
      children: trainingNode.childEdges.map((edge) => ({ id: edge.childId })),
    },
  };
};

// Enforce agreement, lab, training, level, prerequisite, and issuer constraints together.
const validateCertificationProposal = async (
  proposal: CertificationInput,
  excludeCertificationId?: string,
  db: DatabaseClient = prisma
) => {
  if (!proposal.trainingNodeId) {
    throw new AppError(400, 'TRAINING_NODE_REQUIRED', 'Training node is required.');
  }

  if (!proposal.issuedToId) {
    throw new AppError(400, 'ISSUED_TO_REQUIRED', 'Issued to is required.');
  }

  if (!proposal.issuedById) {
    throw new AppError(400, 'ISSUER_REQUIRED', 'Issuer is required.');
  }

  if (
    !Number.isInteger(proposal.level) ||
    proposal.level < 1 ||
    proposal.level > 3
  ) {
    throw new AppError(
      400,
      'INVALID_CERTIFICATION_LEVEL',
      'Certification level must be 1, 2, or 3.'
    );
  }

  const context = await getCertificationValidationContext(proposal, excludeCertificationId, db);

  if (proposal.issuedById === proposal.issuedToId) {
    throw new AppError(400, 'SELF_CERTIFICATION_FORBIDDEN', 'You cannot issue a certification to yourself.');
  }

  if (!canReceiveCertification(
    proposal.issuedById,
    proposal.issuedToId,
    context.recipientAgreementComplete,
  )) {
    throw new AppError(
      409,
      'USER_AGREEMENT_REQUIRED',
      'This user must complete the user agreement before receiving a certification.',
    );
  }

  const duplicate = await db.certification.findFirst({
    where: {
      issuedToId: proposal.issuedToId,
      trainingNodeId: proposal.trainingNodeId,
      level: proposal.level,
      ...(excludeCertificationId
        ? { id: { not: excludeCertificationId } }
        : {}),
    },
    select: {
      id: true,
    },
  });

  if (duplicate) {
    throw new AppError(409, 'DUPLICATE_CERTIFICATION', 'This certification already exists for this student, training node, and level.');
  }

  if (context.requestedLevel === 1) {
    if (context.trainingNodeSummary.parents.length !== 0) {
      const hasParentRequirement = context.trainingNodeSummary.parents.some((parent) =>
        context.receiverCertifications.some(
          (cert) => cert.trainingNodeId === parent.id && cert.status === 'ACTIVE'
        )
      );

      if (!hasParentRequirement) {
        throw new AppError(400, 'PARENT_CERTIFICATION_REQUIRED', 'A parent certification is required for level 1.');
      }
    }
  }

  if (context.requestedLevel > 1) {
    const allChildrenSatisfied = context.trainingNodeSummary.children.every((child) =>
      context.receiverCertifications.some(
        (cert) =>
          cert.trainingNodeId === child.id &&
          cert.status === 'ACTIVE' &&
          cert.level >= context.requestedLevel
      )
    );

    const hasPredecessorLevelCertifications = context.receiverCertifications.some(
      (cert) => cert.status === 'ACTIVE' && cert.level === context.requestedLevel - 1 && cert.trainingNodeId === context.trainingNodeSummary.id
    );

    if (!allChildrenSatisfied || !hasPredecessorLevelCertifications) {
      throw new AppError(400, 'PREVIOUS_LEVEL_CERTIFICATION_REQUIRED', 'Previous level certification requirements were not met.');
    }
  }

  if (!context.issuerRole || !['ADMIN', 'STAFF', 'SUPERVISOR', 'MENTOR'].includes(context.issuerRole)) {
    throw new AppError(403, 'INSUFFICIENT_PRIVILEGES', 'You do not have permission to issue this certification level.');
  }

  if (context.issuerRole === 'MENTOR' && context.requestedLevel === 3) {
    throw new AppError(403, 'INSUFFICIENT_PRIVILEGES', 'Mentors can only issue Basic and Trust certifications.');
  }

  return context;
};

const getCertificationById = async (certificationId: string) => {
  return prisma.certification.findUnique({
    where: {
      id: certificationId,
    },
    select: certificationDetailSelect,
  });
};

// History writes capture before/after snapshots for a durable audit trail.
const createHistoryEntry = async (
  tx: Prisma.TransactionClient,
  certification: CertificationSnapshot,
  action: CertificationHistoryAction,
  changedById: string | null,
  reason: string | null = null,
  before?: CertificationSnapshot | null
) => {
  const previous = before === undefined ? certification : before;

  return (tx as any).certificationHistory.create({
    data: {
      certificationId: certification.id,

      ...buildBeforeSnapshotFields(previous),

      levelAfter: certification.level,
      statusAfter: certification.status,
      expiryDateAfter: certification.expiryDate,
      notesAfter: certification.notes,
      trainingNodeIdAfter: certification.trainingNodeId,

      action,
      changedById,
      reason,
    },
  });
};

// Create a certification and its initial audit entry atomically.
const addCertification = async (certification: CertificationInput) => {
  await validateCertificationProposal(certification);
  const notes = normalizeOptionalText(certification.notes);

  try {
    return await prisma.$transaction(async (tx) => {
      const issuedAt = new Date();
      const durationDays = await getCertificationDurationDays(tx);
      const expiryDate = calculateCertificationExpiryDate(issuedAt, durationDays);
      const createdCertification = await tx.certification.create({
        data: {
          trainingNodeId: certification.trainingNodeId,
          notes,
          level: certification.level,
          issuedToId: certification.issuedToId,
          issuedById: certification.issuedById,
          issuedAt,
          expiryDate,
          status: 'ACTIVE',
        },
        select: certificationDetailSelect,
      });

      await createHistoryEntry(tx, createdCertification as CertificationSnapshot, 'CREATED', certification.issuedById, null, null);

      return createdCertification;
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error?.code === 'P2002') {
      throw new AppError(409, 'DUPLICATE_CERTIFICATION', 'This certification already exists for this student, training node, and level.');
    }

    console.error('Failed to create certification:', error);
    throw new AppError(500, 'CERTIFICATION_CREATE_FAILED', 'Something went wrong while creating the certification.');
  }
};

// Validate an edit against the current graph before updating the record and history.
const updateCertification = async (
  certificationId: string,
  updateData: Partial<CertificationInput>,
  changedById: string,
  reason?: unknown,
) => {
  if (!certificationId?.trim()) {
    throw new AppError(400, 'CERTIFICATION_ID_REQUIRED', 'Certification ID is required.');
  }

  const existing = await getCertificationById(certificationId);
  if (!existing) {
    throw new AppError(404, 'CERTIFICATION_NOT_FOUND', 'Certification not found.');
  }

  if (existing.status === 'REVOKED') {
    throw new AppError(409, 'CERTIFICATION_ALREADY_REVOKED', 'Revoked certifications must be unrevoked before they can be modified.');
  }

  const proposalNotes = updateData.notes ?? existing.notes;
  const proposal: CertificationInput = {
    trainingNodeId: updateData.trainingNodeId ?? existing.trainingNodeId,
    ...(proposalNotes !== null && proposalNotes !== undefined
      ? { notes: proposalNotes }
      : {}),
    level: typeof updateData.level === 'number' ? updateData.level : existing.level,
    issuedToId: updateData.issuedToId ?? existing.issuedTo.id,
    issuedById: changedById,
    expiryDate: updateData.expiryDate ?? existing.expiryDate,
  };

  await validateCertificationProposal(proposal, certificationId);

  const normalizedExpiry = normalizeOptionalDate(proposal.expiryDate);
  const normalizedNotes = normalizeOptionalText(proposal.notes);
  const normalizedReason = normalizeHistoryReason(reason);

  try {
    return await prisma.$transaction(async (tx) => {
      const updatedCertification = await tx.certification.update({
        where: { id: certificationId },
        data: {
          trainingNodeId: proposal.trainingNodeId,
          notes: normalizedNotes,
          level: proposal.level,
          issuedToId: proposal.issuedToId,
          expiryDate: normalizedExpiry,
        },
        select: certificationDetailSelect,
      });

      await createHistoryEntry(tx, updatedCertification as CertificationSnapshot, 'UPDATED', changedById, normalizedReason, existing as CertificationSnapshot);

      return updatedCertification;
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error?.code === 'P2002') {
      throw new AppError(409, 'DUPLICATE_CERTIFICATION', 'This certification already exists for this student, training node, and level.');
    }

    console.error('Failed to update certification:', error);
    throw new AppError(500, 'CERTIFICATION_UPDATE_FAILED', 'Something went wrong while updating the certification.');
  }
};

type RevocationTask = {
  nodeId: string;
  level: 1 | 2 | 3;
};

// Convert graph edges into lookup maps used by cascade invalidation.
const buildEdgeMaps = (edges: { parentId: string; childId: string }[]) => {
  const parentsByChild = new Map<string, string[]>();
  const childrenByParent = new Map<string, string[]>();

  for (const edge of edges) {
    const currentParents = parentsByChild.get(edge.childId) ?? [];
    currentParents.push(edge.parentId);
    parentsByChild.set(edge.childId, currentParents);

    const currentChildren = childrenByParent.get(edge.parentId) ?? [];
    currentChildren.push(edge.childId);
    childrenByParent.set(edge.parentId, currentChildren);
  }

  return {
    parentsByChild,
    childrenByParent,
  };
};

// Recursively invalidate certifications whose prerequisites are no longer satisfied.
const cascadeInvalidateCertification = async (
  certificationId: string,
  targetStatus: 'REVOKED' | 'EXPIRED',
  action: 'REVOKED' | 'EXPIRED',
  changedById: string | null,
  rootReason: string | null,
  dependentReason: string,
) => {
  if (!certificationId?.trim()) {
    throw new AppError(400, 'CERTIFICATION_ID_REQUIRED', 'Certification ID is required.');
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const rootCertification = await tx.certification.findUnique({
        where: { id: certificationId },
        select: certificationDetailSelect,
      });

      if (!rootCertification) {
        throw new AppError(404, 'CERTIFICATION_NOT_FOUND', 'Certification not found.');
      }

      if (rootCertification.status !== 'ACTIVE') {
        throw new AppError(409, 'CERTIFICATION_NOT_ACTIVE', 'Only active certifications can be invalidated.');
      }

      const holderId = rootCertification.issuedTo.id;
      const allHolderCerts = await tx.certification.findMany({
        where: { issuedToId: holderId },
        select: certificationDetailSelect,
      });

      const allEdges = await tx.trainingEdge.findMany({
        select: {
          parentId: true,
          childId: true,
        },
      });

      const { parentsByChild, childrenByParent } = buildEdgeMaps(allEdges);
      const certByNodeLevel = new Map<string, CertificationSnapshot>();

      for (const cert of allHolderCerts as CertificationSnapshot[]) {
        certByNodeLevel.set(`${cert.trainingNodeId}:${cert.level}`, cert);
      }

      const queue: RevocationTask[] = [{ nodeId: rootCertification.trainingNodeId, level: rootCertification.level as 1 | 2 | 3 }];
      const processedTasks = new Set<string>();

      const getCert = (nodeId: string, level: 1 | 2 | 3) => certByNodeLevel.get(`${nodeId}:${level}`) ?? null;

      const revokeCert = async (cert: CertificationSnapshot | null, _legacyAction: CertificationHistoryAction, before?: CertificationSnapshot | null) => {
        if (!cert) {
          return null;
        }

        if (cert.status !== 'ACTIVE') {
          return null;
        }

        const updated = await tx.certification.update({
          where: { id: cert.id },
          data: { status: targetStatus },
          select: certificationDetailSelect,
        });

        const updatedSnapshot = updated as CertificationSnapshot;
        certByNodeLevel.set(`${updatedSnapshot.trainingNodeId}:${updatedSnapshot.level}`, updatedSnapshot);

        await createHistoryEntry(
          tx,
          updatedSnapshot,
          action,
          changedById,
          cert.id === rootCertification.id ? rootReason : dependentReason,
          before ?? cert,
        );
        return updatedSnapshot;
      };

      while (queue.length > 0) {
        const task = queue.shift()!;
        const taskKey = `${task.nodeId}:${task.level}`;

        if (processedTasks.has(taskKey)) {
          continue;
        }
        processedTasks.add(taskKey);

        const current = getCert(task.nodeId, task.level);
        if (!current) {
          continue;
        }

        if (task.level === 1) {
          const changed = await revokeCert(current, 'REVOKED');
          if (!changed) {
            continue;
          }

          const childNodes = childrenByParent.get(task.nodeId) ?? [];
          for (const childNodeId of childNodes) {
            const childLevel1 = getCert(childNodeId, 1);
            if (childLevel1?.status !== 'ACTIVE') {
              continue;
            }

            const parentNodes = parentsByChild.get(childNodeId) ?? [];
            const hasAnyActiveParent = parentNodes.some((parentNodeId) => {
              const parentCert = getCert(parentNodeId, 1);
              return parentCert?.status === 'ACTIVE';
            });

            if (!hasAnyActiveParent) {
              queue.push({ nodeId: childNodeId, level: 1 });
            }
          }

          const sameNodeLevel2 = getCert(task.nodeId, 2);
          if (sameNodeLevel2?.status === 'ACTIVE') {
            queue.push({ nodeId: task.nodeId, level: 2 });
          }

          continue;
        }

        if (task.level === 2) {
          const changed = await revokeCert(current, 'REVOKED');
          if (!changed) {
            continue;
          }

          const sameNodeLevel3 = getCert(task.nodeId, 3);
          if (sameNodeLevel3?.status === 'ACTIVE') {
            queue.push({ nodeId: task.nodeId, level: 3 });
          }

          const parentNodes = parentsByChild.get(task.nodeId) ?? [];
          for (const parentNodeId of parentNodes) {
            const parentLevel2 = getCert(parentNodeId, 2);
            if (parentLevel2?.status === 'ACTIVE') {
              queue.push({ nodeId: parentNodeId, level: 2 });
            }
          }

          continue;
        }

        const changed = await revokeCert(current, 'REVOKED');
        if (!changed) {
          continue;
        }

        const parentNodes = parentsByChild.get(task.nodeId) ?? [];
        for (const parentNodeId of parentNodes) {
          const parentLevel3 = getCert(parentNodeId, 3);
          if (parentLevel3?.status === 'ACTIVE') {
            queue.push({ nodeId: parentNodeId, level: 3 });
          }
        }
      }

      return tx.certification.findUnique({
        where: { id: certificationId },
        select: certificationDetailSelect,
      });
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error(`Failed to mark certification ${targetStatus.toLowerCase()}:`, error);
    throw new AppError(500, 'CERTIFICATION_INVALIDATION_FAILED', 'Something went wrong while updating certification validity.');
  }
};

// Revocation records an explicit reason and cascades dependency effects.
const revokeCertification = async (certificationId: string, changedById: string, reason?: unknown) => {
  if (!changedById?.trim()) {
    throw new AppError(400, 'CHANGED_BY_ID_REQUIRED', 'The user performing this action is required.');
  }
  const normalizedReason = normalizeHistoryReason(reason);
  return cascadeInvalidateCertification(
    certificationId,
    'REVOKED',
    'REVOKED',
    changedById,
    normalizedReason,
    normalizedReason
      ? `A prerequisite certification was revoked. Original reason: ${normalizedReason}`
      : 'A prerequisite certification was revoked, so this dependent certification is no longer valid.',
  );
};

// Scheduled lifecycle reconciliation expires every certification past its due date.
const expireDueCertifications = async (now = new Date()) => {
  const dueCertifications = await prisma.certification.findMany({
    where: {
      status: 'ACTIVE',
      expiryDate: { lte: now },
    },
    select: {
      id: true,
      expiryDate: true,
    },
    orderBy: { expiryDate: 'asc' },
  });

  for (const certification of dueCertifications) {
    const current = await prisma.certification.findUnique({
      where: { id: certification.id },
      select: { status: true },
    });
    if (current?.status !== 'ACTIVE') continue;

    const expiryDate = certification.expiryDate ?? now;
    await cascadeInvalidateCertification(
      certification.id,
      'EXPIRED',
      'EXPIRED',
      null,
      dueDateExpirationReason(expiryDate),
      dependencyExpirationReason,
    );
  }

  return dueCertifications.length;
};

const unrevokeCertification = async (certificationId: string, changedById: string) => {
  if (!certificationId?.trim()) {
    throw new AppError(400, 'CERTIFICATION_ID_REQUIRED', 'Certification ID is required.');
  }

  if (!changedById?.trim()) {
    throw new AppError(400, 'CHANGED_BY_ID_REQUIRED', 'The user performing this action is required.');
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.certification.findUnique({
        where: { id: certificationId },
        select: certificationDetailSelect,
      });

      if (!existing) {
        throw new AppError(404, 'CERTIFICATION_NOT_FOUND', 'Certification not found.');
      }

      if (existing.status === 'ACTIVE') {
        throw new AppError(409, 'CERTIFICATION_ALREADY_ACTIVE', 'Certification is already active.');
      }

      if (existing.status !== 'REVOKED') {
        throw new AppError(409, 'CERTIFICATION_NOT_REVOKED', 'Only revoked certifications can be unrevoked.');
      }

      const proposal: CertificationInput = {
        trainingNodeId: existing.trainingNodeId,
        ...(existing.notes !== null ? { notes: existing.notes } : {}),
        level: existing.level,
        issuedToId: existing.issuedTo.id,
        issuedById: changedById,
        expiryDate: existing.expiryDate,
      };

      await validateCertificationProposal(proposal, certificationId, tx);

      const updated = await tx.certification.update({
        where: { id: certificationId },
        data: {
          status: 'ACTIVE',
        },
        select: certificationDetailSelect,
      });

      await createHistoryEntry(tx, updated as CertificationSnapshot, 'REACTIVATED', changedById, null, existing as CertificationSnapshot);

      return updated;
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error?.code === 'P2002') {
      throw new AppError(409, 'DUPLICATE_CERTIFICATION', 'This certification already exists for this student, training node, and level.');
    }
    throw new AppError(500, 'CERTIFICATION_UNREVOKE_FAILED', error);
  }
};

// Renewal recalculates validity and records the lifecycle transition.
const renewCertification = async (certificationId: string, changedById: string) => {
  if (!certificationId?.trim()) {
    throw new AppError(400, 'CERTIFICATION_ID_REQUIRED', 'Certification ID is required.');
  }
  if (!changedById?.trim()) {
    throw new AppError(400, 'CHANGED_BY_ID_REQUIRED', 'The user performing this action is required.');
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.certification.findUnique({
        where: { id: certificationId },
        select: certificationDetailSelect,
      });
      if (!existing) {
        throw new AppError(404, 'CERTIFICATION_NOT_FOUND', 'Certification not found.');
      }
      if (existing.status !== 'EXPIRED') {
        throw new AppError(409, 'CERTIFICATION_NOT_EXPIRED', 'Only expired certifications can be renewed.');
      }

      const proposal: CertificationInput = {
        trainingNodeId: existing.trainingNodeId,
        ...(existing.notes !== null ? { notes: existing.notes } : {}),
        level: existing.level,
        issuedToId: existing.issuedTo.id,
        issuedById: changedById,
      };
      await validateCertificationProposal(proposal, certificationId, tx);

      const durationDays = await getCertificationDurationDays(tx);
      const renewedAt = new Date();
      const updated = await tx.certification.update({
        where: { id: certificationId },
        data: {
          status: 'ACTIVE',
          expiryDate: calculateCertificationExpiryDate(renewedAt, durationDays),
        },
        select: certificationDetailSelect,
      });

      await createHistoryEntry(
        tx,
        updated as CertificationSnapshot,
        'RENEWED',
        changedById,
        `Renewed for ${durationDays} days after its prerequisites were revalidated.`,
        existing as CertificationSnapshot,
      );
      return updated;
    });
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'CERTIFICATION_RENEW_FAILED', 'Something went wrong while renewing the certification.');
  }
};

const getCertificationHistoryById = async (certificationId: string) => {
  if (!certificationId?.trim()) {
    throw new AppError(400, 'CERTIFICATION_ID_REQUIRED', 'Certification ID is required.');
  }

  const certification = await getCertificationById(certificationId);
  if (!certification) {
    throw new AppError(404, 'CERTIFICATION_NOT_FOUND', 'Certification not found.');
  }

  const historyRows = (await prisma.$queryRaw(certificationHistorySelectSql(certificationId))) as CertificationHistoryRow[];

  return {
    certification: mapCertificationSnapshot(certification),
    historyRecords: historyRows.map((row: any) => mapHistoryRow(row, mapCertificationSnapshot(certification))),
  };
};


// getting training options for when issuing a certificaiton
const hasCertificationAtLevel = (
  trainingId: string,
  requiredLevel: number,
  studentCertifications: { id: string; trainingNode: { id: string }; level: number;}[]
) =>
  studentCertifications.some(
    (cert) =>
      cert.trainingNode.id === trainingId &&
      cert.level === requiredLevel
  );


const allChildrenCertifiedAtLevel = (
  training: {id: string; name?: string; childEdges: {child: {id: string; }}[]; parentEdges: {parent: {id: string; }}[];},
  requiredLevel: number,
  studentCertifications: { id: string; trainingNode: { id: string }; level: number;}[]
) =>
  training.childEdges.length === 0 ||
  training.childEdges.every((childEdge) =>
    hasCertificationAtLevel(childEdge.child.id, requiredLevel, studentCertifications)
  );


// Filter training choices to nodes the selected student can validly receive next.
const getTrainingNamesAndIdsByLabForStudent = async (labId: string, studentId: string) => {
  try {
    if (!labId?.trim()) {
      throw new AppError(400, 'LAB_ID_REQUIRED', 'Lab ID is required.');
    }

    if (!studentId?.trim()) {
      throw new AppError(400, 'STUDENT_ID_REQUIRED', 'Student ID is required.');
    }

    const studentCertifications = await prisma.certification.findMany({
      where: {
        issuedToId: studentId,
        status: 'ACTIVE',
        trainingNode: {
          labId: labId,
      },
      },
      select: {
        id: true,
        trainingNode: {
          select: {
            id: true,
          },
        },
        level: true,
      },
    });

    const trainings = await prisma.trainingNode.findMany({
      where: {
        labId: labId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        parentEdges: {
          select: {
            parent: {
              select: {
                id: true,
              }
            },
          }
        },
        childEdges: {
          select: {
            child: {
              select: {
                id: true,
              }
            }
          }
        }
      },
    });
    
    const trainingOptions = trainings.map((training) => {
      const isRootTraining = training.parentEdges.length === 0;

      const hasCertifiedParent = training.parentEdges.some((parentEdge) =>
        studentCertifications.some(
          (cert) => cert.trainingNode.id === parentEdge.parent.id
        )
      );

      const hasAnyCertification = studentCertifications.some(
        (cert) => cert.trainingNode.id === training.id
      );

      const eligibleForLevel2 =
        hasCertificationAtLevel(training.id, 1, studentCertifications) &&
        allChildrenCertifiedAtLevel(training, 2, studentCertifications);

      const eligibleForLevel3 =
        hasCertificationAtLevel(training.id, 2, studentCertifications) &&
        allChildrenCertifiedAtLevel(training, 3, studentCertifications);

      const isAuthorized = hasCertificationAtLevel(
        training.id,
        3,
        studentCertifications
      );

      let eligibleLevel: 1 | 2 | 3 | null = null;

      if (eligibleForLevel3) {
        eligibleLevel = 3;
      } else if (eligibleForLevel2) {
        eligibleLevel = 2;
      } else if (
        !hasAnyCertification &&
        (hasCertifiedParent || isRootTraining)
      ) {
        eligibleLevel = 1;
      }

      return {
        ...training,
        eligibleLevel,
        isAuthorized,
      };
    });
    
    const response = {
      trainings: trainingOptions.map(
        ({ parentEdges, childEdges, ...trainingOption }) => trainingOption
      ),
    };
    
    return response;

  } catch (error) {
    console.error('Error fetching training names and IDs for student:', error);
    throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'An error occurred while fetching training names and IDs for the student.');
  }
}




const getCertificationHistoryEntryById = async (certificationId: string, historyId: string) => {
  if (!certificationId?.trim()) {
    throw new AppError(400, 'CERTIFICATION_ID_REQUIRED', 'Certification ID is required.');
  }

  if (!historyId?.trim()) {
    throw new AppError(400, 'HISTORY_ID_REQUIRED', 'History ID is required.');
  }

  const certification = await getCertificationById(certificationId);
  if (!certification) {
    throw new AppError(404, 'CERTIFICATION_NOT_FOUND', 'Certification not found.');
  }

  const historyRows = (await prisma.$queryRaw(certificationHistorySelectSql(certificationId))) as CertificationHistoryRow[];
  const history = historyRows.find((row: CertificationHistoryRow) => row.id === historyId);
  if (!history) {
    throw new AppError(404, 'CERTIFICATION_HISTORY_NOT_FOUND', 'History entry not found.');
  }

  return {
    certification: mapCertificationSnapshot(certification),
    history: mapHistoryRow(history as any, mapCertificationSnapshot(certification)),
  };
};

export {
  getRecentCertifications,
  addCertification,
  updateCertification,
  revokeCertification,
  unrevokeCertification,
  renewCertification,
  expireDueCertifications,
  getCertificationDurationDays,
  updateCertificationDurationDays,
  getTabularCertifications,
  getCertificationById,
  getCertificationHistoryById,
  getCertificationHistoryEntryById,
  getTrainingNamesAndIdsByLabForStudent,
  AppError,
};
