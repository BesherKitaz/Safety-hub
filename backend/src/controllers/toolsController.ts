import prisma from '../lib/prisma';
import { AppError, assertLabIsActive } from './labsControllers';

const prismaAny = prisma as any;

const getToolsofLab = async (labId: string) => {
    return prismaAny.tool.findMany({
        where: {
            labId,
        },
    });
};

const getToolNamesAndIdsByLabs = async (labId: string) => {
    return prismaAny.tool.findMany({
        where: {
            labId,
        },
        select: {
            name: true,
            id: true,
        },
    });
};

const getToolById = async (toolId: string) => {
    return prismaAny.tool.findUnique({
        where: { id: toolId },
        select: {
            id: true,
            name: true,
            description: true,
            labId: true,
            isActive: true,
            trainingNode: {
                select: {
                    id: true,
                    isActive: true,
                },
            },
        },
    });
};

const updateTool = async (toolId: string, updateData: { name: string; description?: string }) => {
    try {
        const tool = await getToolById(toolId);

        if (!tool) {
            throw new AppError(404, 'TOOL_NOT_FOUND', 'Tool not found.');
        }

        if (!tool.isActive) {
            throw new AppError(409, 'TOOL_INACTIVE', 'This tool is inactive and cannot be modified.');
        }

        await assertLabIsActive(tool.labId);

        return await prismaAny.tool.update({
            where: { id: toolId },
            data: updateData,
        });
    } catch (error) {
        console.error('Error updating tool:', error);
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(500, 'TOOL_UPDATE_FAILED', 'Failed to update tool');
    }
};

const createTool = async (labId: string, name: string, description?: string) => {
    try {
        await assertLabIsActive(labId);

        return await prismaAny.tool.create({
            data: {
                labId,
                name,
                description: description || null,
            },
        });
    } catch (error) {
        console.error('Error creating tool:', error);
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(500, 'TOOL_CREATE_FAILED', 'Failed to create tool');
    }
};

const deactivateTool = async (toolId: string) => {
    const tool = await getToolById(toolId);

    if (!tool) {
        throw new AppError(404, 'TOOL_NOT_FOUND', 'Tool not found.');
    }

    if (!tool.isActive) {
        throw new AppError(409, 'TOOL_ALREADY_INACTIVE', 'Tool is already inactive.');
    }

    await assertLabIsActive(tool.labId);

    return prismaAny.$transaction(async (tx: any) => {
        const updatedTool = await tx.tool.update({
            where: { id: toolId },
            data: { isActive: false },
        });

        if (tool.trainingNode?.id) {
            await tx.trainingNode.update({
                where: { id: tool.trainingNode.id },
                data: { isActive: false },
            });
        }

        return updatedTool;
    });
};

const activateTool = async (toolId: string) => {
    const tool = await getToolById(toolId);

    if (!tool) {
        throw new AppError(404, 'TOOL_NOT_FOUND', 'Tool not found.');
    }

    await assertLabIsActive(tool.labId);

    return prismaAny.tool.update({
        where: { id: toolId },
        data: { isActive: true },
    });
};

export { getToolsofLab, getToolNamesAndIdsByLabs, updateTool, createTool, deactivateTool, activateTool };
