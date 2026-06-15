import prisma from '../lib/prisma'


const getRecentCertifications = async () => {
    const certifications = await prisma.certification.findMany({
        orderBy: {
            issuedAt: 'desc'
        },
        take: 4,
        include: {
            lab: true,
            issuedTo: true,
            issuedBy: true,
        },
    });
    return certifications;
}




export { getRecentCertifications };