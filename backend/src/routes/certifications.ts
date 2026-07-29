import { Router } from 'express';
import { Prisma, UserRole } from '@prisma/client/index-browser';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import {
  AppError,
  addCertification,
  getCertificationById,
  getCertificationHistoryById,
  getCertificationHistoryEntryById,
  getRecentCertifications,
  getTabularCertifications,
  revokeCertification,
  unrevokeCertification,
  updateCertification,
  renewCertification,
  expireDueCertifications,
  getCertificationDurationDays,
  updateCertificationDurationDays,
} from '../controllers/certificationsControllers';
import { sendError } from '../middleware/errorHandler';
import {
  authorizeCertificationIssuance,
  authorizeCertificationRead,
  authorizeRoles,
  DASHBOARD_ROLES,
  RESOURCE_MANAGER_ROLES,
  RESOURCE_READER_ROLES,
} from '../middleware/resourceAuthorization';

const router = Router();

router.use(authMiddleware);
router.use(async (_req, _res, next) => {
  try {
    await expireDueCertifications();
    next();
  } catch (error) {
    next(error);
  }
});

const handleCertificationError = (res: any, error: unknown, fallback: string) =>
  sendError(res, error, { statusCode: 500, code: 'CERTIFICATION_REQUEST_FAILED', message: fallback });

router.get('/settings/duration', authorizeRoles(...RESOURCE_READER_ROLES), async (_req, res) => {
  try {
    return res.json({
      message: 'Certification duration fetched successfully',
      data: { durationDays: await getCertificationDurationDays() },
    });
  } catch (error) {
    return handleCertificationError(res, error, 'Failed to fetch certification duration');
  }
});

router.put('/settings/duration', authorizeRoles(UserRole.ADMIN), async (req, res) => {
  try {
    return res.json({
      message: 'Certification duration updated successfully',
      data: await updateCertificationDurationDays(req.body?.durationDays),
    });
  } catch (error) {
    return handleCertificationError(res, error, 'Failed to update certification duration');
  }
});

router.get('/tabular/total-rows', authorizeRoles(...RESOURCE_READER_ROLES), async (req: AuthRequest, res) => {
  try {
    const totalRows = await prisma.certification.count({
      where: {
        status: 'ACTIVE',
      },
    });

    return res.json({
      message: 'Total rows fetched successfully',
      data: totalRows,
    });
  } catch (error) {
    handleCertificationError(res, error, 'Failed to fetch total rows');
  }
});

router.get('/tabular', authorizeRoles(...RESOURCE_READER_ROLES), async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};
    console.log('Filters received:', filters);
    const skip = (page - 1) * pageSize;
    const result = await getTabularCertifications(
      skip,
      pageSize,
      filters.status,
      filters.search ?? '',
      filters.level,
    );
    return res.json({
      message: 'Recent certifications fetched successfully',
      data: result.certifications,
      meta: { totalRows: result.totalRows },
    });
  } catch (error) {
    handleCertificationError(res, error, 'Failed to fetch recent certifications');
  }
});


router.get('/recent', authorizeRoles(...DASHBOARD_ROLES), async (req, res) => {
  try {
    const certifications = await getRecentCertifications();
    return res.json({
      message: 'Recent certifications fetched successfully',
      data: certifications,
    });
  } catch (error) {
    handleCertificationError(res, error, 'Failed to fetch recent certifications');
  }
});

router.get('/:id/history/:historyId', authorizeCertificationRead, async (req: AuthRequest<{ id: string; historyId: string }>, res) => {
  try {
    const result = await getCertificationHistoryEntryById(req.params.id, req.params.historyId);
    return res.json({
      message: 'Certification history entry fetched successfully',
      data: result,
    });
  } catch (error) {
    handleCertificationError(res, error, 'Failed to fetch certification history entry');
  }
});

router.get('/:id/history', authorizeCertificationRead, async (req: AuthRequest<{ id: string }>, res) => {
  try {
    const result = await getCertificationHistoryById(req.params.id);
    return res.json({
      message: 'Certification history fetched successfully',
      data: result,
    });
  } catch (error) {
    handleCertificationError(res, error, 'Failed to fetch certification history');
  }
});

router.get('/:id', authorizeCertificationRead, async (req: AuthRequest<{ id: string }>, res) => {
  try {
    const certificationId = req.params.id;
    if (!certificationId) {
      return sendError(res, new AppError(400, 'CERTIFICATION_ID_REQUIRED', 'Certification ID is required'));
    }

    const certification = await getCertificationById(certificationId);
    if (!certification) {
      return sendError(res, new AppError(404, 'CERTIFICATION_NOT_FOUND', 'Certification not found'));
    }

    return res.json({
      message: 'Certification fetched successfully',
      data: certification,
    });
  } catch (error) {
    handleCertificationError(res, error, 'Failed to fetch certification');
  }
});

router.post('/add', authorizeCertificationIssuance, async (req: AuthRequest, res) => {
  const certification = req.body;
  const issuedById = req.user?.userId;

  try {
    const createdCertification = await addCertification({
      ...certification,
      issuedById,
    });

    return res.status(201).json({
      message: 'Certification added successfully',
      data: createdCertification,
    });
  } catch (error) {
    console.error('Error adding certification:', error);
    return sendError(res, error, {
      statusCode: 500,
      code: 'CERTIFICATION_CREATE_FAILED',
      message: 'Failed to add certification',
    });
  }
});

router.put('/:id', authorizeRoles(...RESOURCE_MANAGER_ROLES), async (req: AuthRequest<{ id: string }>, res) => {
  try {
    const { reason, ...updateData } = req.body ?? {};
    const updatedCertification = await updateCertification(req.params.id, updateData, req.user!.userId, reason);
    return res.json({
      message: 'Certification updated successfully',
      data: updatedCertification,
    });
  } catch (error) {
    handleCertificationError(res, error, 'Failed to update certification');
  }
});

router.put('/:id/revoke', authorizeRoles(...RESOURCE_MANAGER_ROLES), async (req: AuthRequest<{ id: string }>, res) => {
  try {
    const updatedCertification = await revokeCertification(req.params.id, req.user!.userId, req.body?.reason);
    return res.json({
      message: 'Certification revoked successfully',
      data: updatedCertification,
    });
  } catch (error) {
    handleCertificationError(res, error, 'Failed to revoke certification');
  }
});

router.put('/:id/unrevoke', authorizeRoles(...RESOURCE_MANAGER_ROLES), async (req: AuthRequest<{ id: string }>, res) => {
  try {
    const updatedCertification = await unrevokeCertification(req.params.id, req.user!.userId);
    return res.json({
      message: 'Certification unrevoked successfully',
      data: updatedCertification,
    });
  } catch (error) {
    handleCertificationError(res, error, 'Failed to unrevoke certification');
  }
});

router.put('/:id/renew', authorizeRoles(...RESOURCE_MANAGER_ROLES), async (req: AuthRequest<{ id: string }>, res) => {
  try {
    const updatedCertification = await renewCertification(req.params.id, req.user!.userId);
    return res.json({
      message: 'Certification renewed successfully',
      data: updatedCertification,
    });
  } catch (error) {
    handleCertificationError(res, error, 'Failed to renew certification');
  }
});

export default router;
