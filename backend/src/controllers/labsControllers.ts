import prisma from '../lib/prisma'



export const getLabs = async () => {
    try {
        const labs = await prisma.lab.findMany();
        return labs;
    } catch (error) {
        throw new Error(`Something went wrong!, ${error}`)
    }
};

