import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

type Certification = {
  labId: string;
  toolId: string;
  notes?: string;
  issuedToId: string;
  issuedById: string;
};

const getRecentCertifications = async () => {
  return await prisma.certification.findMany({
    orderBy: {
      issuedAt: "desc",
    },
    take: 4,
    include: {
      lab: true,
      tool: true,
      issuedTo: true,
      issuedBy: true,
    },
  });
};

const addCertification = async (certification: Certification) => {
  try {
    const createdCertification = await prisma.certification.create({
      data: {
        issuedToId: certification.issuedToId,
        issuedById: certification.issuedById,
        toolId: certification.toolId,
        labId: certification.labId,
        notes: certification.notes ?? null,
      },
    });

    return createdCertification;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("DUPLICATE_CERTIFICATION");
    }

    throw error;
  }
};

export { getRecentCertifications, addCertification };