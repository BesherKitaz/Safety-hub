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
} from '../controllers/certificationsController';

const router = Router();

router.use(authMiddleware);

const handleCertificationError = (res: any, error: unknown, fallback: string) => {
  console.error('Error:', error);
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      code: error.code,
      error: error.message,
    });
  }

  console.error(fallback, error);
  return res.status(500).json({ error: fallback });
};

const requireAdmin = (req: AuthRequest, res: any) => {
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'STAFF') {
    res.status(403).json({
      code: 'FORBIDDEN',
      error: 'Access denied. Admin privileges required.',
    });
    return false;
  }

  return true;
};

router.get('/tabular/total-rows', authMiddleware, async (req: AuthRequest, res) => {
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'STAFF') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }

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

router.get('/tabular', authMiddleware, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};
    console.log('Filters received:', filters);
    const skip = (page - 1) * pageSize;
    const certifications = await getTabularCertifications(skip, pageSize, filters.status);
    return res.json({
      message: 'Recent certifications fetched successfully',
      data: certifications,
    });
  } catch (error) {
    handleCertificationError(res, error, 'Failed to fetch recent certifications');
  }
});


router.get('/recent', authMiddleware, async (req, res) => {
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

router.get('/:id/history/:historyId', authMiddleware, async (req: AuthRequest<{ id: string; historyId: string }>, res) => {
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

router.get('/:id/history', authMiddleware, async (req: AuthRequest<{ id: string }>, res) => {
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

router.get('/:id', authMiddleware, async (req: AuthRequest<{ id: string }>, res) => {
  try {
    const certificationId = req.params.id;
    if (!certificationId) {
      return res.status(400).json({ message: 'Certification ID is required' });
    }

    const certification = await getCertificationById(certificationId);
    if (!certification) {
      return res.status(404).json({ message: 'Certification not found' });
    }

    return res.json({
      message: 'Certification fetched successfully',
      data: certification,
    });
  } catch (error) {
    handleCertificationError(res, error, 'Failed to fetch certification');
  }
});

router.post('/add', authMiddleware, async (req: AuthRequest, res) => {
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
    if (error instanceof Error && error.message === 'DUPLICATE_CERTIFICATION') {
      return res.status(409).json({
        message: 'This student already has this certification for this lab/tool.',
      });
    } else if (error instanceof Error && error.message === 'PARENT_CERTIFICATION_REQUIRED') {
      return res.status(400).json({
        message: 'Eligibility validation failed. Please ensure all parent certifications are active.',
      });
    } else if (error instanceof Error && error.message === 'PREVIOUS_LEVEL_CERTIFICATION_REQUIRED') {
      return res.status(400).json({
        message: 'Eligibility validation failed. Please ensure all previous level certifications are active.',
      });
    } else if (error instanceof Error && error.message === 'INSUFFICIENT_PRIVILEGES') {
      return res.status(400).json({
        message: 'Eligibility validation failed. You do not have the required privileges to issue this certification.',
      });
    } else if (error instanceof Error && error.message === 'USER_AGREEMENT_REQUIRED') {
      return res.status(400).json({
        message: 'Eligibility validation failed. Please complete the user agreement.',
      });
    } else if (error instanceof Error && error.message === 'RECEIVER_CERTIFICATIONS_NOT_FOUND') {
      return res.status(400).json({
        message: 'Eligibility validation failed. No certifications found for the receiver.',
      });
    } else if (error instanceof Error && error.message === 'REQUESTED_LEVEL_NOT_FOUND') {
      return res.status(400).json({
        message: 'Eligibility validation failed. Requested level not found.',
      });
    } else if (error instanceof Error && error.message === 'TRAINING_NODE_NOT_FOUND') {
      return res.status(400).json({
        message: 'Eligibility validation failed. Training node not found.',
      });
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({
        message: 'This student already has this certification for this lab/tool.',
      });
    }

    console.error('Error adding certification:', error);

    return res.status(500).json({
      message: 'Failed to add certification',
      error,
    });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest<{ id: string }>, res) => {
  if (!requireAdmin(req, res)) {
    return;
  }

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

router.put('/:id/revoke', authMiddleware, async (req: AuthRequest<{ id: string }>, res) => {
  if (!requireAdmin(req, res)) {
    return;
  }

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

router.put('/:id/unrevoke', authMiddleware, async (req: AuthRequest<{ id: string }>, res) => {
  if (!requireAdmin(req, res)) {
    return;
  }

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
