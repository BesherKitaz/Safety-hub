import { Router } from 'express'

import { authMiddleware } from '../middleware/auth'
import type { AuthRequest } from "../middleware/auth"
import { getToolsofLab, getToolNamesAndIdsByLabs, updateTool, createTool } from '../controllers/toolsController';
import { isUserAdmin } from '../util/checkRoles'
import prisma from '../lib/prisma';
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


router.put('/update/:toolId', authMiddleware, async (req: AuthRequest, res) => {
    const { toolId } = req.params;
    const { name, description } = req.body;

    if (!toolId || !name ) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const updatedTool = await updateTool(toolId, { name, description });
        res.json({
            data: updatedTool,
            message: "Tool updated successfully"
        });
    } catch (error) {
        res.status(500).json({ error: `Failed to update tool, ${error}` });
    }
});

router.get('/updated/:toolId', authMiddleware, async (req: AuthRequest, res) => {
    const { toolId } = req.params;  
    if (!toolId) {
        return res.status(400).json({ error: 'Missing toolId parameter' });
    }
    const tool = await prisma.tool.findUnique({
        where: {
            id: toolId
        }, 
        select: {
            name: true,
            description: true
        }
    });

    if (!tool) {
        return res.status(404).json({ error: 'Tool not found' });
    }

    res.json({
        data: tool,
        message: "Tool fetched successfully"
    });
});


router.post('/create', authMiddleware, async (req: AuthRequest, res) => {
    const { labId, name, description } = req.body;
    if (!labId || !name) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }
    try {
        const newTool = await createTool(labId as string, name as string, description as string);
        res.json({
            data: newTool,
            message: "Tool created successfully"
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create tool' });
    }
});
export default router;

