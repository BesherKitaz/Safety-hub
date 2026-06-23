import { Router } from 'express'

import { authMiddleware } from '../middleware/auth'
import type { AuthRequest } from "../middleware/auth"
import { getToolsofLab, getToolNamesAndIdsByLabs } from '../controllers/toolsController';
import { isUserAdmin } from '../util/checkRoles'
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


router.get('/listings', authMiddleware, async (req: AuthRequest, res) => {
    const userId: string = req.user!.userId;
    if (!(await isUserAdmin(userId))) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const {labId} = req.query
    console.log("labId:", labId)
    const tools = await getToolNamesAndIdsByLabs(labId as string);
        console.log("tools response:", tools);
        res.json({
            data: tools,
            message: "Tools fetched successfully"
        });
    if (!labId) {
        return res.status(400).json({ error: 'Missing labId parameter' });
    }
})
export default router;

