import prisma from '../lib/prisma'





const getToolsofLab = async (labId: string) => {
    const tools = await prisma.tool.findMany({
        where: {
            labId: labId
        }
    });
    return tools;
}

const getToolNamesAndIdsByLabs = async (labId: string) => {
    const tools = await prisma.tool.findMany({
        where: {
            labId: labId
        },
        select: {
            name: true,
            id: true
        }
    });
    return tools;
};

export { getToolsofLab, getToolNamesAndIdsByLabs };