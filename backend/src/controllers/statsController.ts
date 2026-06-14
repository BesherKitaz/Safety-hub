import prisma from '../lib/prisma'









const collectStats = async () => {
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);


    const totalStudents = await prisma.user.count({
        where: {
            role: 'STUDENT'
        }
    });
    const totalCertifications = await prisma.certification.count();
    const certificationsThisMonth = await prisma.certification.count({
        where: {
            issuedAt: {
                gte: startOfMonth
            }
        }
    });
    const totalMentors = await prisma.user.count({
        where: {
            role: 'MENTOR'
        }
    });

    return {
        totalStudents,
        totalCertifications,
        totalMentors,
        certificationsThisMonth
    };

}







export default collectStats;