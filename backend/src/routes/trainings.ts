import { Router } from 'express'
import { authMiddleware } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { getTrainingsofLab, getTrainingNamesAndIdsByLab, addTraining, AppError, getTrainingById, updateTraining, deactivateTraining, activateTraining } from '../controllers/trainingsControllers';
import { isUserAdmin, isUserStaff } from '../util/checkRoles';

const router = Router();

router.use(authMiddleware);

const handleTrainingError = (res: any, error: unknown, fallback: string) => {
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            code: error.code,
            error: error.message,
        });
    }

    console.error(fallback, error);
    return res.status(500).json({ error: fallback });
};

router.get('/', async (req: AuthRequest, res) => {
    const { labId } = req.query;
    if (!labId) {
        return res.status(400).json({ error: 'Missing labId parameter' });
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

router.get('/listings', async (req: AuthRequest, res) => {
    const { labId } = req.query;
    if (!labId) {
        return res.status(400).json({ error: 'Missing labId parameter' });
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

router.post('/add', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    if (!isUserAdmin(userId) && !isUserStaff(userId)) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

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

router.get('/:trainingId', async (req: AuthRequest, res) => {
    const { trainingId } = req.params;
    if (!trainingId) {
        return res.status(400).json({ error: 'Missing trainingId parameter' });
    }

    try {
        const training = await getTrainingById(trainingId);
        res.json({
            data: training,
            message: 'Training fetched successfully',
        });
    } catch (error) {
        handleTrainingError(res, error, 'Failed to fetch training');
    }
});

router.put('/update/:trainingId', async (req: AuthRequest, res) => {
    const { trainingId } = req.params;
    const updateData = req.body;
    const userId = req.user!.userId;
    if (!isUserAdmin(userId) && !isUserStaff(userId)) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    if (!trainingId) {
        return res.status(400).json({ error: 'Missing trainingId parameter' });
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

router.patch('/:trainingId/deactivate', async (req: AuthRequest, res) => {
    const { trainingId } = req.params;
    const userId = req.user!.userId;
    if (!isUserAdmin(userId) && !isUserStaff(userId)) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    if (!trainingId) {
        return res.status(400).json({ error: 'Missing trainingId parameter' });
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

router.patch('/:trainingId/activate', async (req: AuthRequest, res) => {
    const { trainingId } = req.params;
    const userId = req.user!.userId;
    if (!isUserAdmin(userId) && !isUserStaff(userId)) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    if (!trainingId) {
        return res.status(400).json({ error: 'Missing trainingId parameter' });
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
