import Router from 'express'
import type { AuthRequest } from '../middleware/auth'
import { authMiddleware } from '../middleware/auth';
import {  getRecentCertifications, addCertification, getTabularCertifications } from '../controllers/certificationsController';
import { Prisma } from '@prisma/client/index-browser';
import prisma from "../lib/prisma";


const router = Router();

router.use(authMiddleware);


router.get('/tabular', authMiddleware, async (req, res) => {
    try{
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 10;

        const skip = (page - 1) * pageSize;
        const certifications = await getTabularCertifications(skip, pageSize);
            console.log("Fetching tabular certifications", certifications);

        res.json({
            message: "Recent certifications fetched successfully",
            data: certifications
        });
    }
    catch (error) {
        console.error("Error fetching recent certifications:", error);
        res.status(500).json({ error: 'Failed to fetch recent certifications' });   
    }
})

router.get('/tabular/total-rows', authMiddleware, async (req: AuthRequest, res) => {
    if ((req.user?.role !== "ADMIN") && (req.user?.role !== "STAFF")) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    try {
        const totalRows = await prisma.certification.count({
            where: {
                status: "ACTIVE",
            },
        })
        res.json({
            message: "Total rows fetched successfully",
            data: totalRows
        });
    } catch (error) {
        console.error("Error fetching total rows:", error);
        res.status(500).json({ error: 'Failed to fetch total rows' });
    }
});


router.get('/recent', authMiddleware, async (req, res) => {
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
        else if ( error instanceof Error && error.message === "PARENT_CERTIFICATION_REQUIRED" ) {
            return res.status(400).json({
                message: "Eligibility validation failed. Please ensure all parent certifications are active.",
            });
        }

        else if ( error instanceof Error && error.message === "PREVIOUS_LEVEL_CERTIFICATION_REQUIRED" ) {
            return res.status(400).json({
                message: "Eligibility validation failed. Please ensure all previous level certifications are active.",
            });
        }
        else if ( error instanceof Error && error.message === "INSUFFICIENT_PRIVILEGES" ) {
            return res.status(400).json({
                message: "Eligibility validation failed. You do not have the required privileges to issue this certification.",
            });
        }
        else if ( error instanceof Error && error.message === "USER_AGREEMENT_REQUIRED" ) {
            return res.status(400).json({
                message: "Eligibility validation failed. Please complete the user agreement.",
            });
        }
        else if ( error instanceof Error && error.message === "RECEIVER_CERTIFICATIONS_NOT_FOUND" ) {
            return res.status(400).json({
                message: "Eligibility validation failed. No certifications found for the receiver.",
            });
        }
        else if ( error instanceof Error && error.message === "REQUESTED_LEVEL_NOT_FOUND" ) {
            return res.status(400).json({
                message: "Eligibility validation failed. Requested level not found.",
            });
        }
        else if ( error instanceof Error && error.message === "TRAINING_NODE_NOT_FOUND" ) {
            return res.status(400).json({
                message: "Eligibility validation failed. Training node not found.",
            });
        }
        else if (  
                error instanceof Prisma.PrismaClientKnownRequestError &&
                 error.code === "P2002"
                ) {
                return res.status(409).json({
                message: "This student already has this certification for this lab/tool.",
            });
        }
        console.error("Error adding certification:", error);

        return res.status(500).json({
            message: "Failed to add certification",
            error: error,
        });
    }
});


export default router;