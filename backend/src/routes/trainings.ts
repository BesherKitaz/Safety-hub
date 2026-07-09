import { Router } from 'express'
import { authMiddleware } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth"
import { getTrainingsofLab, getTrainingNamesAndIdsByLab, addTraining, AppError, getTrainingById, updateTraining } from '../controllers/trainingsControllers';
import { isUserAdmin, isUserStaff } from '../util/checkRoles';


const router = Router();

router.use(authMiddleware);



router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    // Fetches trainings of a specific lab
    const { labId } = req.query;
    if (!labId) {
        return res.status(400).json({ error: 'Missing labId parameter' });
    }
    try {
        const trainings = await getTrainingsofLab(labId as string);
        res.json({
            data: trainings,
            message: "Trainings fetched successfully"
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch trainings' });
    }
})

router.get('/listings', authMiddleware, async (req: AuthRequest, res) => {
    // Fetches training names and IDs of a specific lab
    const { labId } = req.query;
    if (!labId) {
        return res.status(400).json({ error: 'Missing labId parameter' });
    }
    try {
        const trainings = await getTrainingNamesAndIdsByLab(labId as string);
        res.json({
            data: trainings,
            message: "Trainings fetched successfully"
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch trainings' });
    }
})


router.post('/add', authMiddleware, async (req: AuthRequest, res) => {
    // Adds a new trainging to the database
    const userId = req.user!.userId;
    if (!isUserAdmin(userId) && !isUserStaff(userId)) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    const training = req.body;
    console.log('Received training data:', training); // Log the received training data for debugging
    try {
        const createdTraining = await addTraining({
            ...training,
        });
        res.status(201).json({
            data: createdTraining,
            message: "Training added successfully"
        });
    } catch (error) {
        console.error('Error adding training:', error);
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
        code: error.code,
        error: error.message,
      });
    }
        res.status(500).json({ error: 'Failed to add training' });
    }
})


router.get('/:trainingId', authMiddleware, async (req: AuthRequest, res) => {
    const { trainingId } = req.params;
    try {
        if (!trainingId) {
            return res.status(400).json({ error: 'Missing trainingId parameter' });
        }
        const training = await getTrainingById(trainingId);
        res.json({
            data: training,
            message: "Training fetched successfully"
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch training' });
    }
})

router.put('/update/:trainingId', authMiddleware, async (req: AuthRequest, res) => {
    const { trainingId } = req.params;
    const updateData = req.body;
    const userId = req.user!.userId;
    if (!isUserAdmin(userId) && !isUserStaff(userId)) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    try {
        if (!trainingId) {
            return res.status(400).json({ error: 'Missing trainingId parameter' });
        }

        const updatedTraining = await updateTraining(trainingId, updateData);
        res.json({
            data: updatedTraining,
            message: "Training updated successfully"
        });
    } catch (error: any) {
        console.error('Error updating training:', error);
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                code: error.code,
                error: error.message,
            });
        }
        res.status(500).json({ error: 'Failed to update training' });
    }
});

export default router;

