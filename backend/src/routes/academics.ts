import { Router } from 'express';
import { UserRole } from '@prisma/client';
import {
  createCollege,
  createDepartment,
  getAcademicStats,
  listAcademicManagement,
  listAcademicOptions,
  updateCollege,
  updateDepartment,
} from '../controllers/academicsControllers';
import { authMiddleware } from '../middleware/auth';
import { authorizeRoles } from '../middleware/resourceAuthorization';
import { sendError } from '../middleware/errorHandler';

const router = Router();
const respondError = (res: any, error: unknown) =>
  sendError(res, error, { statusCode: 500, code: 'ACADEMIC_REQUEST_FAILED', message: 'Academic affiliation request failed.' });

router.get('/options', async (_req, res) => {
  try {
    return res.json({ data: await listAcademicOptions() });
  } catch (error) {
    return respondError(res, error);
  }
});

router.use(authMiddleware, authorizeRoles(UserRole.ADMIN));

router.get('/manage', async (_req, res) => {
  try {
    return res.json({ data: await listAcademicManagement() });
  } catch (error) {
    return respondError(res, error);
  }
});

router.get('/stats', async (_req, res) => {
  try {
    return res.json({ data: await getAcademicStats() });
  } catch (error) {
    return respondError(res, error);
  }
});

router.post('/colleges', async (req, res) => {
  try {
    return res.status(201).json({ data: await createCollege(req.body?.name) });
  } catch (error) {
    return respondError(res, error);
  }
});

router.put('/colleges/:id', async (req, res) => {
  try {
    return res.json({ data: await updateCollege(req.params.id, req.body ?? {}) });
  } catch (error) {
    return respondError(res, error);
  }
});

router.post('/colleges/:collegeId/departments', async (req, res) => {
  try {
    return res.status(201).json({ data: await createDepartment(req.params.collegeId, req.body?.name) });
  } catch (error) {
    return respondError(res, error);
  }
});

router.put('/departments/:id', async (req, res) => {
  try {
    return res.json({ data: await updateDepartment(req.params.id, req.body ?? {}) });
  } catch (error) {
    return respondError(res, error);
  }
});

export default router;
