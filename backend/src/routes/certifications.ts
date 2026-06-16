import Router from 'express'
import type { AuthRequest } from '../middleware/auth'
import { authMiddleware } from '../middleware/auth';
import {  getRecentCertifications, addCertification } from '../controllers/certificationsController';
import { Prisma } from '@prisma/client/index-browser';




const router = Router();

router.use(authMiddleware);

router.get('/recent', async (req, res) => {
    try {
        const certifications = await getRecentCertifications();
        res.json({
            message: "Recent certifications fetched successfully",
            data: certifications
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recent certifications' });
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
            message: "Certification added successfully",
            data: createdCertification,
        });

    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "DUPLICATE_CERTIFICATION"
        ) {
            return res.status(409).json({
                message: "This student already has this certification for this lab/tool.",
            });
        }

        console.error("Error adding certification:", error);

        return res.status(500).json({
            message: "Failed to add certification",
        });
    }
});
export default router;