import prisma from '../lib/prisma'



const getTrainingsofLab = async (labId: string) => {
    // Implementation to fetch trainings of a specific lab
    const trainings = await prisma.trainingNode.findMany({
        where: {
            labId: labId
        }
    });
    return trainings;
};

export { getTrainingsofLab };