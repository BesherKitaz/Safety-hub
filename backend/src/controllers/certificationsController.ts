import { Prisma, UserRole  } from "@prisma/client";
import prisma from "../lib/prisma";


type Certification = {
  trainingNodeId: string;
  notes?: string;
  level: number;
  issuedToId: string;
  issuedById: string;
};

type CertificationSummary = {
  trainingNodeId: string;
  level: number;
  status: "ACTIVE" | "REVOKED" | "EXPIRED" | "DEACTIVATED";
};



type TrainingNodeSummary = {
  id: string;

  parents: {
    id: string;
  }[];

  children: {
    id: string;
  }[];
};



const getRecentCertifications = async () => {
  try {
    console.log("Attempting to fetch recent certifications22");
    const recentCertifications = await prisma.certification.findMany({
      orderBy: {
        issuedAt: "desc",
      },
      where: {
        status: "ACTIVE",
      },
      take: 4,
      include: {
        trainingNode: {
          select: {
            name: true,
            lab: {
              select: {
                name: true,
              }
            }
          }
        },
        issuedTo: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        issuedBy: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
      },
    });
    return recentCertifications;
  } catch (error) {
    throw error;
  }
};

const getTabularCertifications = async (skip: number, pageSize: number) => {
  try {
    
    const certifications = await prisma.certification.findMany({
      skip,
      take: pageSize,
      select: {
        id: true,
        trainingNode: {
          select: {
            id: true,
            name: true,
            lab: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },

        issuedTo: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          }
        },
        issuedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          }
        },
        issuedAt: true,
        expiryDate: true,
        status: true,
      },
    });

    // Get most recent modification date for each certification from the certificationHistory table
    const certificationIds = certifications.map((cert) => cert.id);

    const latestHistoryRows = await prisma.certificationHistory.findMany({
      where: {
        certificationId: {
          in: certificationIds,
        },
      },
      orderBy: {
        changedAt: "desc",
      },
      distinct: ["certificationId"],
      select: {
        certificationId: true,
        changedAt: true,
      },
    });

    const latestHistoryByCertId = new Map(
      latestHistoryRows.map((history: { certificationId: string; changedAt: Date }) => [
        history.certificationId,
        history.changedAt,
      ])
    );

    const tabularCertifications = certifications.map((cert) => ({
      ...cert,
      lastUpdated:
        latestHistoryByCertId.get(cert.id) ?? cert.issuedAt,
    }));
    
    console.log("Tabular certifications fetched successfully:", tabularCertifications);
    return tabularCertifications;

  } catch (error) {
    throw error;
  }
    };


const addCertification = async (certification: Certification) => {
  try {
    const { issuerRole, receiver_certifications, requestedLevel, trainingNodeSummary } = await getEligibiltyValidationData(certification);
    if (!issuerRole || !receiver_certifications || !requestedLevel || !trainingNodeSummary) {
        throw new Error("VALIDATION_DATA_NOT_FOUND");
    }
     const isValid = validateEligibility(issuerRole, receiver_certifications, true, requestedLevel, trainingNodeSummary);
     if (!isValid) {
        throw new Error("ELIGIBILITY_VALIDATION_FAILED");
     }
     await prisma.certification.create({
        data: {
            ...certification,
            status: "ACTIVE"
        }
     });
     console.log("Eligibility validation result:", isValid);
     return "Certification added successfully";
     
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

const getEligibiltyValidationData = async (certification: Certification) => {
  // Implementation to fetch the necessary data for eligibility validation for issuing a certification
    const issuer = await prisma.user.findUnique({
        where: {
            id: certification.issuedById
        },
        select: {
            role: true
        }
    });
    const issuerRole = issuer?.role;
    if (!issuerRole) {
        throw new Error("ISSUER_NOT_FOUND");
    }

    const receiver_certifications = await prisma.certification.findMany({
        where: {
            issuedToId: certification.issuedToId
        },
        select: {
            trainingNodeId: true,
            level: true,
            status: true
        }
    });

    if (!receiver_certifications) {
        throw new Error("RECEIVER_CERTIFICATIONS_NOT_FOUND");
    }

    const requestedLevel = certification.level;
    console.log("Requested level:", requestedLevel);
    if (!requestedLevel) {
        throw new Error("REQUESTED_LEVEL_NOT_FOUND");
    }

    const trainingNode = await prisma.trainingNode.findUnique({
        where: {
            id: certification.trainingNodeId
        },
        select: {
            id: true,
            name: true,
            parentEdges: {
                select: {
                    parentId: true
                }
            },
            childEdges: {
                select: {
                    childId: true
                }
            }
        }
    });
    if (!trainingNode) {
      throw new Error("TRAINING_NODE_NOT_FOUND");
    }

    const trainingNodeSummary = {
      id: trainingNode.id,
      parents: trainingNode.parentEdges.map(edge => ({
        id: edge.parentId,
      })),
      children: trainingNode.childEdges.map(edge => ({
        id: edge.childId,
      })),
    };


    if (!trainingNodeSummary) {
        throw new Error("TRAINING_NODE_NOT_FOUND");
    }

    return { issuerRole, receiver_certifications, requestedLevel, trainingNodeSummary };
};

const validateEligibility = (issuerRole: UserRole, receiver_certifications: CertificationSummary[], userAgreement = true, requestedLevel: number, trainingNode: TrainingNodeSummary) => {
  // Implementation to validate the eligibility of the certification issuance

    // validation for level 1 certifications
  if (requestedLevel === 1) {
    
    if (trainingNode.parents && trainingNode.parents.length !== 0) {    
      // If it has a parent or more, check if they at least have a parent certification

        const hasParentRequirement = trainingNode.parents.some(parent =>
        receiver_certifications.some(
          cert =>
            cert.trainingNodeId === parent.id &&
            cert.status === "ACTIVE"
        )
      );
      if (!hasParentRequirement) {
        throw new Error("PARENT_CERTIFICATION_REQUIRED");
      }
    }
  }

  // Check if the user has the required previous level certification
  if (requestedLevel > 1) {
    const allChildrenSatisfied = trainingNode.children.every(child =>
      receiver_certifications.some(cert =>
        cert.trainingNodeId === child.id &&
        cert.status === "ACTIVE" &&
        cert.level >= requestedLevel
      )
    );

    const hasPredecessorLevelCertifications = receiver_certifications.some(cert => 
      cert.status === "ACTIVE" && 
      cert.level === requestedLevel - 1 && 
      cert.trainingNodeId === trainingNode.id
    )
  
    if (!allChildrenSatisfied || !hasPredecessorLevelCertifications) {
      throw new Error("PREVIOUS_LEVEL_CERTIFICATION_REQUIRED");
    }
  }

  // is this issuer (user) role authorized to grant such a level of certification? 
  if ((requestedLevel > 2) && (issuerRole !== "ADMIN")) {
    throw new Error("INSUFFICIENT_PRIVILEGES");
  }
  if (requestedLevel > 1 && requestedLevel <= 2 && (issuerRole !== "ADMIN" && issuerRole !== "SUPERVISOR")) {
    throw new Error("INSUFFICIENT_PRIVILEGES");
  }
  if (requestedLevel === 1 && (issuerRole !== "ADMIN" && issuerRole !== "STAFF" && issuerRole !== "SUPERVISOR" && issuerRole !== "MENTOR")) {
    throw new Error("INSUFFICIENT_PRIVILEGES");
  }

  // Did the recipient do the user agreement?
  if (!userAgreement) {
    throw new Error("USER_AGREEMENT_REQUIRED");
  }

  return true;
}

export { getRecentCertifications, addCertification, getTabularCertifications };