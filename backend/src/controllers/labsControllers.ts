import prisma from '../lib/prisma'



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
                trainingNodes: {
                    select: {
                        id: true,
                        name: true,
                        tool: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    },
                },
                tools: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            }
        });
        return lab;
    }
    catch (error) {
        throw new Error(`Something went wrong!, ${error}`)
    }
}


export { getLabs, getLabsNamesAndIds, getLabById }