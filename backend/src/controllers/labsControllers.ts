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


export { getLabs, getLabsNamesAndIds }