import { Router } from 'express'
import { authMiddleware } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth"
import { getTrainingsofLab } from '../controllers/trainingsControllers';



const router = Router();

router.use(authMiddleware);



router.get('/', authMiddleware, async (req: AuthRequest, res) => {
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

export default router;