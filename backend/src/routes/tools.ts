import { Router } from 'express'

import { authMiddleware } from '../middleware/auth'
import type { AuthRequest } from "../middleware/auth"
import { getToolsofLab, getToolNamesAndIdsByLabs, updateTool, createTool, deactivateTool, activateTool } from '../controllers/toolsControllers';
import { AppError } from '../controllers/labsControllers';
import { isUserAdmin } from '../util/checkRoles'
import prisma from '../lib/prisma';
import { sendError } from '../middleware/errorHandler';

const router = Router();

router.use(authMiddleware);

const handleToolError = (res: any, error: unknown, fallback: string) =>
    sendError(res, error, { statusCode: 500, code: 'TOOL_REQUEST_FAILED', message: fallback });

router.get('/', async (req: AuthRequest, res) => {
    const { labId } = req.query;
    if (!labId) {
        return sendError(res, new AppError(400, 'LAB_ID_REQUIRED', 'Missing labId parameter'));
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
        return sendError(res, new AppError(401, 'UNAUTHORIZED', 'Unauthorized'));
    }

    const { labId } = req.query;
    if (!labId) {
        return sendError(res, new AppError(400, 'LAB_ID_REQUIRED', 'Missing labId parameter'));
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
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const description = typeof req.body?.description === 'string' ? req.body.description : undefined;

    if (!toolId || !name) {
        return sendError(res, new AppError(400, 'MISSING_REQUIRED_PARAMETERS', 'Missing required parameters'));
    }

    const userId: string = req.user!.userId;
    if (!(await isUserAdmin(userId))) {
        return sendError(res, new AppError(403, 'FORBIDDEN', 'Access denied. Admin privileges required.'));
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
        return sendError(res, new AppError(400, 'TOOL_ID_REQUIRED', 'Missing toolId parameter'));
    }

    const userId: string = req.user!.userId;
    if (!(await isUserAdmin(userId))) {
        return sendError(res, new AppError(403, 'FORBIDDEN', 'Access denied. Admin privileges required.'));
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
        return sendError(res, new AppError(400, 'TOOL_ID_REQUIRED', 'Missing toolId parameter'));
    }

    const userId: string = req.user!.userId;
    if (!(await isUserAdmin(userId))) {
        return sendError(res, new AppError(403, 'FORBIDDEN', 'Access denied. Admin privileges required.'));
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
        return sendError(res, new AppError(400, 'TOOL_ID_REQUIRED', 'Missing toolId parameter'));
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
        return sendError(res, new AppError(404, 'TOOL_NOT_FOUND', 'Tool not found'));
    }

    res.json({
        data: tool,
        message: 'Tool fetched successfully',
    });
});

router.post('/create', async (req: AuthRequest, res) => {
    const labId = typeof req.body?.labId === 'string' ? req.body.labId : '';
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const description = typeof req.body?.description === 'string' ? req.body.description : undefined;

    if (!labId || !name) {
        return sendError(res, new AppError(400, 'MISSING_REQUIRED_PARAMETERS', 'Missing required parameters'));
    }

    const userId: string = req.user!.userId;
    if (!(await isUserAdmin(userId))) {
        return sendError(res, new AppError(403, 'FORBIDDEN', 'Access denied. Admin privileges required.'));
    }

    try {
        const newTool = await createTool(labId, name, description);
        res.status(201).json({
            data: newTool,
            message: 'Tool created successfully',
        });
    } catch (error) {
        handleToolError(res, error, 'Failed to create tool');
    }
});

export default router;
