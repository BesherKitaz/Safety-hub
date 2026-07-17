import prisma from '../lib/prisma'
import { AppError } from '../middleware/errorHandler';
const prismaAny = prisma as any

class LabIdRequiredError extends AppError {
    constructor() {
        super(400, 'LAB_ID_REQUIRED', 'Lab ID is required');
        this.name = "LabIdRequiredError";
    }
}

type LabInput = {
    name: string;
    description?: string | null;
};

const normalizeOptionalText = (value?: string | null) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
};

export const assertLabIsActive = async (labId: string) => {
    const lab = await prismaAny.lab.findUnique({
        where: {
            id: labId,
        },
        select: {
            isActive: true,
        },
    });

    if (!lab) {
        throw new AppError(404, 'LAB_NOT_FOUND', 'Lab not found.');
    }

    if (!lab.isActive) {
        throw new AppError(409, 'LAB_INACTIVE', 'This lab is inactive and cannot be modified.');
    }
};

const getLabs = async () => {
    try {
        return await prismaAny.lab.findMany({
            orderBy: {
                name: 'asc',
            },
        });
    } catch (error) {
        throw new AppError(500, 'LAB_FETCH_FAILED', `Something went wrong!, ${error}`)
    }
};

const getLabsNamesAndIds = async () => {
    try {
        return await prismaAny.lab.findMany({
            select: {
                name: true,
                id: true,
                isActive: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
    }
    catch (error) {
        throw new AppError(500, 'LAB_FETCH_FAILED', `Something went wrong!, ${error}`)
    }
}

const getDeactivatedLabs = async () => {
    try {
        return await prismaAny.lab.findMany({
            where: {
                isActive: false,
            },
            select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                isActive: true,
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });
    } catch (error) {
        throw new AppError(500, 'LAB_FETCH_FAILED', `Something went wrong!, ${error}`)
    }
};

const getLabById = async (labId: string) => {
    try {
        return await prismaAny.lab.findUnique({
            where: {
                id: labId
            },
            select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                isActive: true,
            }
        });
    }
    catch (error) {
        throw new AppError(500, 'LAB_FETCH_FAILED', `Something went wrong!, ${error}`)
    }
}

const getTrainingNodesByLabId = async (labId: string) => {
    if (!labId) {
        throw new LabIdRequiredError();
    }
    try {
        return await prismaAny.trainingNode.findMany({
            where: {
                labId: labId
            }, 
            select: {
                id: true,
                name: true,
                type: true,
                isActive: true,
                tool: {
                    select: {
                        id: true,
                        name: true,
                        isActive: true,
                    }
                }
            },
            orderBy: {
                name: 'asc',
            },
        })
    } catch (error) {
        throw new AppError(500, 'LAB_FETCH_FAILED', `Something went wrong!, ${error}`)
    }
}

const getToolsByLabId = async (labId: string) => {
    if (!labId) {
        throw new LabIdRequiredError();
    }
    try {
        return await prismaAny.tool.findMany({
            where: {
                labId: labId
            },
            select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                isActive: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
    } catch (error) {
        throw new Error(`Something went wrong!, ${error}`)
    }
}

const createLab = async (labData: LabInput) => {
    const name = labData.name.trim();
    const description = normalizeOptionalText(labData.description);

    if (!name) {
        throw new AppError(400, 'LAB_NAME_REQUIRED', 'Lab name is required.');
    }
    try {
        return await prismaAny.lab.create({
            data: {
                name,
                description,
            },
        });
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new AppError(409, 'LAB_NAME_TAKEN', 'A lab with this name already exists.');
        }

        throw new AppError(500, 'LAB_CREATE_FAILED', 'Something went wrong while creating the lab.');
    }
};

const updateLab = async (labId: string, labData: LabInput) => {
    const name = labData.name.trim();
    const description = normalizeOptionalText(labData.description);

    if (!labId) {
        throw new AppError(400, 'LAB_ID_REQUIRED', 'Lab ID is required.');
    }

    if (!name) {
        throw new AppError(400, 'LAB_NAME_REQUIRED', 'Lab name is required.');
    }
    try {
        return await prismaAny.lab.update({
            where: {
                id: labId,
            },
            data: {
                name,
                description,
            },
        });
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new AppError(409, 'LAB_NAME_TAKEN', 'A lab with this name already exists.');
        }

        if (error.code === 'P2025') {
            throw new AppError(404, 'LAB_NOT_FOUND', 'Lab not found.');
        }

        throw new AppError(500, 'LAB_UPDATE_FAILED', 'Something went wrong while updating the lab.');
    }
};

const setLabActiveState = async (labId: string, isActive: boolean) => {
    if (!labId) {
        throw new AppError(400, 'LAB_ID_REQUIRED', 'Lab ID is required.');
    }

    try {
        return await prismaAny.$transaction(async (tx: any) => {
            const lab = await tx.lab.update({
                where: { id: labId },
                data: { isActive },
            });

            if (!isActive) {
                await tx.tool.updateMany({
                    where: { labId },
                    data: { isActive: false },
                });

                await tx.trainingNode.updateMany({
                    where: { labId },
                    data: { isActive: false },
                });
            }

            return lab;
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            throw new AppError(404, 'LAB_NOT_FOUND', 'Lab not found.');
        }

        throw new AppError(
            500,
            isActive ? 'LAB_ACTIVATE_FAILED' : 'LAB_DEACTIVATE_FAILED',
            `Something went wrong while ${isActive ? 'activating' : 'deactivating'} the lab.`
        );
    }
};

const deactivateLab = async (labId: string) => setLabActiveState(labId, false);
const activateLab = async (labId: string) => setLabActiveState(labId, true);

export {
    getLabs,
    getLabsNamesAndIds,
    getDeactivatedLabs,
    getLabById,
    getToolsByLabId,
    getTrainingNodesByLabId,
    createLab,
    updateLab,
    deactivateLab,
    activateLab,
    LabIdRequiredError,
    AppError,
}














