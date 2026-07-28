import prisma from '../lib/prisma'
import { getReportingPeriodStarts } from '../util/reportingPeriods';









const collectStats = async () => {
    
    const { startOfMonth } = getReportingPeriodStarts();


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
