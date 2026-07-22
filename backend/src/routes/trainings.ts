import { Router } from 'express'
import { authMiddleware } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { getTrainingsofLab, getTrainingNamesAndIdsByLab, addTraining, AppError, getTrainingById, updateTraining, deactivateTraining, activateTraining } from '../controllers/trainingsControllers';
import { sendError } from '../middleware/errorHandler';
import { authorizeRoles, RESOURCE_MANAGER_ROLES, RESOURCE_READER_ROLES } from '../middleware/resourceAuthorization';

const router = Router();

router.use(authMiddleware);

const handleTrainingError = (res: any, error: unknown, fallback: string) =>
    sendError(res, error, { statusCode: 500, code: 'TRAINING_REQUEST_FAILED', message: fallback });

router.get('/', authorizeRoles(...RESOURCE_READER_ROLES), async (req: AuthRequest, res) => {
    const { labId } = req.query;
    if (!labId) {
        return sendError(res, new AppError(400, 'LAB_ID_REQUIRED', 'Missing labId parameter'));
    }

    try {
        const trainings = await getTrainingsofLab(labId as string);
        res.json({
            data: trainings,
            message: 'Trainings fetched successfully',
        });
    } catch (error) {
        handleTrainingError(res, error, 'Failed to fetch trainings');
    }
});

router.get('/listings', authorizeRoles(...RESOURCE_READER_ROLES), async (req: AuthRequest, res) => {
    const { labId } = req.query;
    if (!labId) {
        return sendError(res, new AppError(400, 'LAB_ID_REQUIRED', 'Missing labId parameter'));
    }

    try {
        const trainings = await getTrainingNamesAndIdsByLab(labId as string);
        res.json({
            data: trainings,
            message: 'Trainings fetched successfully',
        });
    } catch (error) {
        handleTrainingError(res, error, 'Failed to fetch trainings');
    }
});

router.post('/add', authorizeRoles(...RESOURCE_MANAGER_ROLES), async (req: AuthRequest, res) => {
    try {
        const createdTraining = await addTraining({
            ...req.body,
        });
        res.status(201).json({
            data: createdTraining,
            message: 'Training added successfully',
        });
    } catch (error) {
        handleTrainingError(res, error, 'Failed to add training');
    }
});

router.get('/:trainingId', authorizeRoles(...RESOURCE_READER_ROLES), async (req: AuthRequest, res) => {
    const { trainingId } = req.params;
    if (!trainingId) {
        return sendError(res, new AppError(400, 'TRAINING_ID_REQUIRED', 'Missing trainingId parameter'));
    }

    try {
        const training = await getTrainingById(trainingId);
        res.json({
            data: training,
            message: 'Training fetched successfully',
        });
    } catch (error) {
        console.error('Error fetching training:', error);
        handleTrainingError(res, error, 'Failed to fetch training');
    }
});

router.put('/update/:trainingId', authorizeRoles(...RESOURCE_MANAGER_ROLES), async (req: AuthRequest, res) => {
    const { trainingId } = req.params;
    const updateData = req.body;
    if (!trainingId) {
        return sendError(res, new AppError(400, 'TRAINING_ID_REQUIRED', 'Missing trainingId parameter'));
    }
    try {
        const updatedTraining = await updateTraining(trainingId, updateData);
        res.json({
            data: updatedTraining,
            message: 'Training updated successfully',
        });
    } catch (error) {
        handleTrainingError(res, error, 'Failed to update training');
    }
});

router.patch('/:trainingId/deactivate', authorizeRoles(...RESOURCE_MANAGER_ROLES), async (req: AuthRequest, res) => {
    const { trainingId } = req.params;
    if (!trainingId) {
        return sendError(res, new AppError(400, 'TRAINING_ID_REQUIRED', 'Missing trainingId parameter'));
    }

    try {
        const updatedTraining = await deactivateTraining(trainingId);
        res.json({
            data: updatedTraining,
            message: 'Training deactivated successfully',
        });
    } catch (error) {
        handleTrainingError(res, error, 'Failed to deactivate training');
    }
});

router.patch('/:trainingId/activate', authorizeRoles(...RESOURCE_MANAGER_ROLES), async (req: AuthRequest, res) => {
    const { trainingId } = req.params;
    if (!trainingId) {
        return sendError(res, new AppError(400, 'TRAINING_ID_REQUIRED', 'Missing trainingId parameter'));
    }

    try {
        const updatedTraining = await activateTraining(trainingId);
        res.json({
            data: updatedTraining,
            message: 'Training activated successfully',
        });
    } catch (error) {
        handleTrainingError(res, error, 'Failed to activate training');
    }
});

export default router;
