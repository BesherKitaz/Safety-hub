import prisma from '../lib/prisma'





async function getToolsofLab(labId: string) {
    const tools = await prisma.tool.findMany({
        where: {
            labId: labId
        }
    });
    return tools;
}


export { getToolsofLab } 