import { Router } from 'express'

import { authMiddleware } from '../middleware/auth'
import type { AuthRequest } from "../middleware/auth"
import { getToolsofLab, getToolNamesAndIdsByLabs, updateTool, createTool, deactivateTool, activateTool } from '../controllers/toolsController';
import { AppError } from '../controllers/labsControllers';
import { isUserAdmin } from '../util/checkRoles'
import prisma from '../lib/prisma';

const router = Router();

router.use(authMiddleware);

const handleToolError = (res: any, error: unknown, fallback: string) => {
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
        const tools = await getToolsofLab(labId as string);
        res.json({
            data: tools,
            message: 'Tools fetched successfully',
        });
    } catch (error) {
        handleToolError(res, error, 'Failed to fetch tools');
    }
});

router.get('/listings', async (req: AuthRequest, res) => {
    const userId: string = req.user!.userId;
    if (!(await isUserAdmin(userId))) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { labId } = req.query;
    if (!labId) {
        return res.status(400).json({ error: 'Missing labId parameter' });
    }

    try {
        const tools = await getToolNamesAndIdsByLabs(labId as string);
        res.json({
            data: tools,
            message: 'Tools fetched successfully',
        });
    } catch (error) {
        handleToolError(res, error, 'Failed to fetch tools');
    }
});

router.put('/update/:toolId', async (req: AuthRequest, res) => {
    const { toolId } = req.params;
    const { name, description } = req.body;

    if (!toolId || !name) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const userId: string = req.user!.userId;
    if (!(await isUserAdmin(userId))) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    try {
        const updatedTool = await updateTool(toolId, { name, description });
        res.json({
            data: updatedTool,
            message: 'Tool updated successfully',
        });
    } catch (error) {
        handleToolError(res, error, 'Failed to update tool');
    }
});

router.patch('/:toolId/deactivate', async (req: AuthRequest, res) => {
    const { toolId } = req.params;
    if (!toolId) {
        return res.status(400).json({ error: 'Missing toolId parameter' });
    }

    const userId: string = req.user!.userId;
    if (!(await isUserAdmin(userId))) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    try {
        const updatedTool = await deactivateTool(toolId);
        res.json({
            data: updatedTool,
            message: 'Tool deactivated successfully',
        });
    } catch (error) {
        handleToolError(res, error, 'Failed to deactivate tool');
    }
});

router.patch('/:toolId/activate', async (req: AuthRequest, res) => {
    const { toolId } = req.params;
    if (!toolId) {
        return res.status(400).json({ error: 'Missing toolId parameter' });
    }

    const userId: string = req.user!.userId;
    if (!(await isUserAdmin(userId))) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    try {
        const updatedTool = await activateTool(toolId);
        res.json({
            data: updatedTool,
            message: 'Tool activated successfully',
        });
    } catch (error) {
        handleToolError(res, error, 'Failed to activate tool');
    }
});

router.get('/updated/:toolId', async (req: AuthRequest, res) => {
    const { toolId } = req.params;
    if (!toolId) {
        return res.status(400).json({ error: 'Missing toolId parameter' });
    }

    const tool = await prisma.tool.findUnique({
        where: {
            id: toolId,
        },
        select: {
            name: true,
            description: true,
        },
    });

    if (!tool) {
        return res.status(404).json({ error: 'Tool not found' });
    }

    res.json({
        data: tool,
        message: 'Tool fetched successfully',
    });
});

router.post('/create', async (req: AuthRequest, res) => {
    const { labId, name, description } = req.body;
    if (!labId || !name) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const userId: string = req.user!.userId;
    if (!(await isUserAdmin(userId))) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    try {
        const newTool = await createTool(labId as string, name as string, description as string);
        res.status(201).json({
            data: newTool,
            message: 'Tool created successfully',
        });
    } catch (error) {
        handleToolError(res, error, 'Failed to create tool');
    }
});

export default router;
