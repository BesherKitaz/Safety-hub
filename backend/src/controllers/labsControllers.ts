import prisma from '../lib/prisma'



export const getLabs = async () => {
    const labs = await prisma.lab.findMany();
    return labs;
};

