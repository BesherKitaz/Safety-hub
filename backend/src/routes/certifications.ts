import Router from 'express'

import { authMiddleware } from '../middleware/auth';
import { getRecentCertifications } from '../controllers/certificationsController';




const router = Router();

router.use(authMiddleware);

router.get('/recent', async (req, res) => {
    try {
        const certifications = await getRecentCertifications();
        res.json(certifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recent certifications' });
    }
});

export default router;