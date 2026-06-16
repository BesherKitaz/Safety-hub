import { Router } from 'express'

import { authMiddleware } from '../middleware/auth'
import type { AuthRequest } from "../middleware/auth"
import { getToolsofLab } from '../controllers/toolsController';

const router = Router();

router.use(authMiddleware);



router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    const { labId } = req.query;
    if (!labId) {
        return res.status(400).json({ error: 'Missing labId parameter' });
    }
    try {
        const tools = await getToolsofLab(labId as string);
        console.log("tools response:", tools);
        res.json({
            data: tools,
            message: "Tools fetched successfully"
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tools' });
    }
})

export default router;