import type { NextFunction, Response } from 'express';
import { UserRole } from '@prisma/client';

import type { AuthRequest } from './auth';
import { AppError } from './errorHandler';
import prisma from '../lib/prisma';

export const RESOURCE_READER_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.STAFF,
  UserRole.SUPERVISOR,
  UserRole.MENTOR,
];

export const RESOURCE_MANAGER_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.STAFF];
export const LAB_MANAGER_ROLES: UserRole[] = [UserRole.ADMIN];

export const canIssueCertification = (role: UserRole, level: number) =>
  RESOURCE_READER_ROLES.includes(role) && (role !== UserRole.MENTOR || level <= 2);

export const canManageCertifications = (role: UserRole) =>
  RESOURCE_MANAGER_ROLES.includes(role);

export const canReadCertification = (role: UserRole, userId: string, issuedToId: string) =>
  RESOURCE_READER_ROLES.includes(role) || (role === UserRole.STUDENT && userId === issuedToId);

export const authorizeRoles = (...allowedRoles: UserRole[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    const role = req.user?.role as UserRole | undefined;

    if (!role || !allowedRoles.includes(role)) {
      return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action.'));
    }

    next();
  };

export const authorizeCertificationIssuance = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const role = req.user?.role as UserRole | undefined;
  const level = Number(req.body?.level);

  if (!role || !RESOURCE_READER_ROLES.includes(role)) {
    return next(new AppError(403, 'FORBIDDEN', 'You are not allowed to issue certifications.'));
  }

  if (role === UserRole.MENTOR && level === 3) {
    return next(new AppError(403, 'FORBIDDEN', 'Mentors can only issue Basic and Trust certifications.'));
  }

  if (!canIssueCertification(role, level)) {
    return next(new AppError(403, 'FORBIDDEN', 'You are not allowed to issue this certification level.'));
  }

  next();
};

export const authorizeStudentSelf = (parameterName = 'id') =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (req.user?.role === UserRole.STUDENT && req.params[parameterName] !== req.user.userId) {
      return next(new AppError(403, 'FORBIDDEN', 'Students can only access their own user details.'));
    }

    next();
  };

export const authorizeCertificationRead = async (
  req: AuthRequest<{ id: string }>,
  _res: Response,
  next: NextFunction
) => {
  const role = req.user?.role as UserRole | undefined;

  if (role && RESOURCE_READER_ROLES.includes(role)) {
    return next();
  }

  if (role !== UserRole.STUDENT) {
    return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to view this certification.'));
  }

  try {
    const certification = await prisma.certification.findUnique({
      where: { id: req.params.id },
      select: { issuedToId: true },
    });

    if (!certification || !canReadCertification(role, req.user!.userId, certification.issuedToId)) {
      return next(new AppError(403, 'FORBIDDEN', 'Students can only access their own certifications.'));
    }

    next();
  } catch (error) {
    next(error);
  }
};
