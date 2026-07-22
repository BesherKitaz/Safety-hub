import { Router } from 'express';
import { Prisma } from '@prisma/client/index-browser';
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
} from '../controllers/certificationsControllers';
import { sendError } from '../middleware/errorHandler';
import {
  authorizeCertificationIssuance,
  authorizeCertificationRead,
  authorizeRoles,
  RESOURCE_MANAGER_ROLES,
  RESOURCE_READER_ROLES,
} from '../middleware/resourceAuthorization';

const router = Router();

router.use(authMiddleware);

const handleCertificationError = (res: any, error: unknown, fallback: string) =>
  sendError(res, error, { statusCode: 500, code: 'CERTIFICATION_REQUEST_FAILED', message: fallback });

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
    const certifications = await getTabularCertifications(skip, pageSize, filters.status, filters.search ?? '');
    return res.json({
      message: 'Recent certifications fetched successfully',
      data: certifications,
    });
  } catch (error) {
    handleCertificationError(res, error, 'Failed to fetch recent certifications');
  }
});


router.get('/recent', authorizeRoles(...RESOURCE_READER_ROLES), async (req, res) => {
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
    const updatedCertification = await updateCertification(req.params.id, req.body, req.user!.userId);
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
    const updatedCertification = await revokeCertification(req.params.id, req.user!.userId);
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

export default router;
