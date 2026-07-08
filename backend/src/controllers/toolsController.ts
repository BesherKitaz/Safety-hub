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

const updateTool = async (toolId: string, updateData: { name: string; description?: string }) => {
    try {
        const updatedTool = await prisma.tool.update({
            where: {
                id: toolId
            },
            data: updateData
            
        });
        return updatedTool;
    } catch (error) {
        console.error("Error updating tool:", error);
        throw new Error('Failed to update tool');
    }

};

export { getToolsofLab, getToolNamesAndIdsByLabs, updateTool };