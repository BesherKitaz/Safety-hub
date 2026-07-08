import prisma from '../lib/prisma'

class LabIdRequiredError extends Error {
    constructor() {
        super("Lab ID is required");
        this.name = "LabIdRequiredError";
    }
}

const getLabs = async () => {
    try {
        const labs = await prisma.lab.findMany();
        return labs;
    } catch (error) {
        throw new Error(`Something went wrong!, ${error}`)
    }
};

const getLabsNamesAndIds = async () => {
    try {
        const labs = await prisma.lab.findMany({
            select: {
                name: true,
                id: true,                
            }
        });
        return labs;
    }
    catch (error) {
        throw new Error(`Something went wrong!, ${error}`)
    }
}

const getLabById = async (labId: string) => {
    try {
        const lab = await prisma.lab.findUnique({
            where: {
                id: labId
            },
            select: {
                name: true,
                id: true,
                description: true,
                createdAt: true,
                updatedAt: true,
            }
        });
        return lab;
    }
    catch (error) {
        throw new Error(`Something went wrong!, ${error}`)
    }
}

const getTrainingNodesByLabId = async (labId: string) => {
    if (!labId) {
        throw new LabIdRequiredError();
    }
    try {
        const trainingNodes = await prisma.trainingNode.findMany({
            where: {
                labId: labId
            }, 
            select: {
                id: true,
                name: true,
                type: true,
                tool: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
        })

        return trainingNodes;
    } catch (error) {
        throw new Error(`Something went wrong!, ${error}`)
    }
}


const getToolsByLabId = async (labId: string) => {
    if (!labId) {
        throw new LabIdRequiredError();
    }
    try {
        const tools = await prisma.tool.findMany({
            where: {
                labId: labId
            },
            select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return tools;
    } catch (error) {
        throw new Error(`Something went wrong!, ${error}`)
    }
}

export { getLabs, getLabsNamesAndIds, getLabById, getToolsByLabId, getTrainingNodesByLabId, LabIdRequiredError }

