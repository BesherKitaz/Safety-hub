import { Prisma, UserRole } from '@prisma/client';
import prisma from '../lib/prisma';

class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

type CertificationInput = {
  trainingNodeId: string;
  notes?: string;
  level: number;
  issuedToId: string;
  issuedById: string;
  expiryDate?: string | Date | null;
};

type CertificationStatus = 'ACTIVE' | 'DEACTIVATED' | 'EXPIRED' | 'REVOKED';

type CertificationHistoryAction = 'CREATED' | 'UPDATED' | 'REVOKED' | 'REACTIVATED' | 'EXPIRED' | 'DEACTIVATED';

type CertificationSummary = {
  trainingNodeId: string;
  level: number;
  status: CertificationStatus;
};

type TrainingNodeSummary = {
  id: string;
  parents: { id: string }[];
  children: { id: string }[];
};

type CertificationPerson = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
} | null;

type CertificationTrainingNode = {
  id: string;
  name: string;
  type: string;
  lab: { id: string; name: string } | null;
  tool: { id: string; name: string } | null;
};

type HistoricalCertification = {
  id: string;
  trainingNodeId: string;
  notes: string | null;
  status: CertificationStatus;
  level: number;
  expiryDate: Date | null;
  issuedAt: Date;
  issuedTo: CertificationPerson;
  issuedBy: CertificationPerson;
  trainingNode: CertificationTrainingNode | null;
};

type HistoryRecordResponse = {
  id: string;
  certificationId: string;
  action: CertificationHistoryAction;
  levelBefore: number;
  statusBefore: CertificationStatus;
  expiryDateBefore: Date | null;
  notesBefore: string | null;
  trainingNodeIdBefore: string;
  reason: string | null;
  changedAt: Date;
  changedBy: CertificationPerson;
  trainingNodeBefore: CertificationTrainingNode | null;
  historicalCertification: HistoricalCertification;
};

type CertificationDetail = {
  id: string;
  notes: string | null;
  status: CertificationStatus;
  level: number;
  expiryDate: Date | null;
  issuedAt: Date;
  trainingNode: CertificationTrainingNode;
  issuedTo: CertificationPerson;
  issuedBy: CertificationPerson;
};

const normalizeOptionalText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizeOptionalDate = (value?: string | Date | null) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const personSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

const trainingNodeSelect = {
  id: true,
  name: true,
  type: true,
  lab: {
    select: {
      id: true,
      name: true,
    },
  },
  tool: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

const certificationDetailSelect = {
  id: true,
  notes: true,
  status: true,
  level: true,
  expiryDate: true,
  issuedAt: true,
  trainingNode: {
    select: trainingNodeSelect,
  },
  issuedTo: {
    select: personSelect,
  },
  issuedBy: {
    select: personSelect,
  },
} as const;

const getRecentCertifications = async () => {
  const recentCertifications = await prisma.certification.findMany({
    orderBy: {
      issuedAt: 'desc',
    },
    where: {
      status: 'ACTIVE',
    },
    take: 4,
    include: {
      trainingNode: {
        select: {
          name: true,
          lab: {
            select: {
              name: true,
            },
          },
        },
      },
      issuedTo: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      issuedBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return recentCertifications;
};

const getTabularCertifications = async (skip: number, pageSize: number) => {
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
            },
          },
        },
      },
      issuedTo: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
      issuedBy: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
      issuedAt: true,
      expiryDate: true,
      status: true,
    },
  });

  const certificationIds = certifications.map((cert) => cert.id);

  const latestHistoryRows = await selectCertificationHistoryRowsForTabular(certificationIds);

  const latestHistoryByCertId = new Map(
    latestHistoryRows.map((history) => [history.certificationId, history.changedAt])
  );

  return certifications.map((cert) => ({
    ...cert,
    lastUpdated: latestHistoryByCertId.get(cert.id) ?? cert.issuedAt,
  }));
};

const selectCertificationHistoryRowsForTabular = async (certificationIds: string[]) => {
  if (certificationIds.length === 0) {
    return [] as { certificationId: string; changedAt: Date }[];
  }

  return prisma.$queryRaw<{ certificationId: string; changedAt: Date }[]>(Prisma.sql`
    SELECT DISTINCT ON (h."certificationId")
      h."certificationId",
      h."changedAt"
    FROM "CertificationHistory" h
    WHERE h."certificationId" IN (${Prisma.join(certificationIds)})
    ORDER BY h."certificationId", h."changedAt" DESC
  `);
};

const getEligibiltyValidationData = async (certification: CertificationInput) => {
  const issuer = await prisma.user.findUnique({
    where: {
      id: certification.issuedById,
    },
    select: {
      role: true,
    },
  });
  const issuerRole = issuer?.role;
  if (!issuerRole) {
    throw new Error('ISSUER_NOT_FOUND');
  }

  const receiver_certifications = await prisma.certification.findMany({
    where: {
      issuedToId: certification.issuedToId,
    },
    select: {
      trainingNodeId: true,
      level: true,
      status: true,
    },
  });

  const requestedLevel = certification.level;
  if (!requestedLevel) {
    throw new Error('REQUESTED_LEVEL_NOT_FOUND');
  }

  const trainingNode = await prisma.trainingNode.findUnique({
    where: {
      id: certification.trainingNodeId,
    },
    select: {
      id: true,
      name: true,
      parentEdges: {
        select: {
          parentId: true,
        },
      },
      childEdges: {
        select: {
          childId: true,
        },
      },
    },
  });
  if (!trainingNode) {
    throw new Error('TRAINING_NODE_NOT_FOUND');
  }

  const trainingNodeSummary = {
    id: trainingNode.id,
    parents: trainingNode.parentEdges.map((edge) => ({
      id: edge.parentId,
    })),
    children: trainingNode.childEdges.map((edge) => ({
      id: edge.childId,
    })),
  };

  return { issuerRole, receiver_certifications, requestedLevel, trainingNodeSummary };
};

const validateEligibility = (
  issuerRole: UserRole,
  receiver_certifications: CertificationSummary[],
  userAgreement = true,
  requestedLevel: number,
  trainingNode: TrainingNodeSummary
) => {
  if (requestedLevel === 1) {
    if (trainingNode.parents && trainingNode.parents.length !== 0) {
      const hasParentRequirement = trainingNode.parents.some((parent) =>
        receiver_certifications.some(
          (cert) => cert.trainingNodeId === parent.id && cert.status === 'ACTIVE'
        )
      );
      if (!hasParentRequirement) {
        throw new Error('PARENT_CERTIFICATION_REQUIRED');
      }
    }
  }

  if (requestedLevel > 1) {
    const allChildrenSatisfied = trainingNode.children.every((child) =>
      receiver_certifications.some(
        (cert) =>
          cert.trainingNodeId === child.id &&
          cert.status === 'ACTIVE' &&
          cert.level >= requestedLevel
      )
    );

    const hasPredecessorLevelCertifications = receiver_certifications.some(
      (cert) => cert.status === 'ACTIVE' && cert.level === requestedLevel - 1 && cert.trainingNodeId === trainingNode.id
    );

    if (!allChildrenSatisfied || !hasPredecessorLevelCertifications) {
      throw new Error('PREVIOUS_LEVEL_CERTIFICATION_REQUIRED');
    }
  }

  if (requestedLevel > 2 && issuerRole !== 'ADMIN') {
    throw new Error('INSUFFICIENT_PRIVILEGES');
  }
  if (requestedLevel > 1 && requestedLevel <= 2 && issuerRole !== 'ADMIN' && issuerRole !== 'SUPERVISOR') {
    throw new Error('INSUFFICIENT_PRIVILEGES');
  }
  if (requestedLevel === 1 && issuerRole !== 'ADMIN' && issuerRole !== 'STAFF' && issuerRole !== 'SUPERVISOR' && issuerRole !== 'MENTOR') {
    throw new Error('INSUFFICIENT_PRIVILEGES');
  }

  if (!userAgreement) {
    throw new Error('USER_AGREEMENT_REQUIRED');
  }

  return true;
};

const getCertificationById = async (certificationId: string) => {
  return prisma.certification.findUnique({
    where: {
      id: certificationId,
    },
    select: certificationDetailSelect,
  });
};

type CertificationHistoryRow = {
  id: string;
  certificationId: string;
  action: CertificationHistoryAction;
  levelBefore: number;
  statusBefore: CertificationStatus;
  expiryDateBefore: Date | null;
  notesBefore: string | null;
  trainingNodeIdBefore: string;
  reason: string | null;
  changedAt: Date;
  changedById: string | null;
  changedByFirstName: string | null;
  changedByLastName: string | null;
  changedByEmail: string | null;
  trainingNodeBeforeName: string | null;
  trainingNodeBeforeType: string | null;
};

const buildHistoricalTrainingNode = (row: CertificationHistoryRow): CertificationTrainingNode | null => {
  if (!row.trainingNodeBeforeName) {
    return null;
  }

  return {
    id: row.trainingNodeIdBefore,
    name: row.trainingNodeBeforeName,
    type: row.trainingNodeBeforeType ?? 'GENERAL',
    lab: null,
    tool: null,
  };
};

const buildHistoryPerson = (row: CertificationHistoryRow): CertificationPerson => {
  if (!row.changedById) {
    return null;
  }

  return {
    id: row.changedById,
    firstName: row.changedByFirstName ?? '',
    lastName: row.changedByLastName ?? '',
    email: row.changedByEmail ?? '',
  };
};

const mapHistoricalCertification = (
  row: CertificationHistoryRow,
  certification: CertificationDetail
): HistoryRecordResponse => {
  const trainingNode = buildHistoricalTrainingNode(row);

  return {
    id: row.id,
    certificationId: row.certificationId,
    action: row.action,
    levelBefore: row.levelBefore,
    statusBefore: row.statusBefore,
    expiryDateBefore: row.expiryDateBefore,
    notesBefore: row.notesBefore,
    trainingNodeIdBefore: row.trainingNodeIdBefore,
    reason: row.reason,
    changedAt: row.changedAt,
    changedBy: buildHistoryPerson(row),
    trainingNodeBefore: trainingNode,
    historicalCertification: {
      id: certification.id,
      trainingNodeId: row.trainingNodeIdBefore,
      notes: row.notesBefore,
      status: row.statusBefore,
      level: row.levelBefore,
      expiryDate: row.expiryDateBefore,
      issuedAt: certification.issuedAt,
      issuedTo: certification.issuedTo,
      issuedBy: certification.issuedBy,
      trainingNode,
    },
  };
};

const selectCertificationHistoryRows = async (certificationId: string) => {
  return prisma.$queryRaw<CertificationHistoryRow[]>(Prisma.sql`
    SELECT
      h."id",
      h."certificationId",
      h."action",
      h."levelBefore",
      h."statusBefore",
      h."expiryDateBefore",
      h."notesBefore",
      h."trainingNodeIdBefore",
      h."reason",
      h."changedAt",
      h."changedById",
      u."firstName" AS "changedByFirstName",
      u."lastName" AS "changedByLastName",
      u."email" AS "changedByEmail",
      tn."name" AS "trainingNodeBeforeName",
      tn."type" AS "trainingNodeBeforeType"
    FROM "CertificationHistory" h
    LEFT JOIN "User" u ON u."id" = h."changedById"
    LEFT JOIN "TrainingNode" tn ON tn."id" = h."trainingNodeIdBefore"
    WHERE h."certificationId" = ${certificationId}
    ORDER BY h."changedAt" DESC
  `);
};

const addCertification = async (certification: CertificationInput) => {
  const { issuerRole, receiver_certifications, requestedLevel, trainingNodeSummary } = await getEligibiltyValidationData(certification);
  if (!issuerRole || !receiver_certifications || !requestedLevel || !trainingNodeSummary) {
    throw new Error('VALIDATION_DATA_NOT_FOUND');
  }

  const isValid = validateEligibility(issuerRole, receiver_certifications, true, requestedLevel, trainingNodeSummary);
  if (!isValid) {
    throw new Error('ELIGIBILITY_VALIDATION_FAILED');
  }

  const expiryDate = normalizeOptionalDate(certification.expiryDate);
  const notes = normalizeOptionalText(certification.notes);

  try {
    return await prisma.$transaction(async (tx) => {
      const createdCertification = await tx.certification.create({
        data: {
          trainingNodeId: certification.trainingNodeId,
          notes,
          level: certification.level,
          issuedToId: certification.issuedToId,
          issuedById: certification.issuedById,
          expiryDate,
          status: 'ACTIVE',
        },
      });

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "CertificationHistory" (
          "certificationId",
          "levelBefore",
          "statusBefore",
          "expiryDateBefore",
          "notesBefore",
          "trainingNodeIdBefore",
          "action",
          "changedById",
          "reason"
        ) VALUES (
          ${createdCertification.id},
          ${createdCertification.level},
          ${createdCertification.status},
          ${createdCertification.expiryDate},
          ${createdCertification.notes},
          ${createdCertification.trainingNodeId},
          'CREATED',
          ${certification.issuedById},
          ${null}
        )
      `);

      return tx.certification.findUnique({
        where: { id: createdCertification.id },
        select: certificationDetailSelect,
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new Error('DUPLICATE_CERTIFICATION');
    }

    throw error;
  }
};

const getCertificationHistoryById = async (certificationId: string) => {
  if (!certificationId?.trim()) {
    throw new AppError(400, 'CERTIFICATION_ID_REQUIRED', 'Certification ID is required.');
  }

  const certification = await prisma.certification.findUnique({
    where: {
      id: certificationId,
    },
    select: certificationDetailSelect,
  });

  if (!certification) {
    throw new AppError(404, 'CERTIFICATION_NOT_FOUND', 'Certification not found.');
  }

  const historyRows = await selectCertificationHistoryRows(certificationId);

  return {
    certification,
    historyRecords: historyRows.map((record) => mapHistoricalCertification(record, certification)),
  };
};

const getCertificationHistoryEntryById = async (certificationId: string, historyId: string) => {
  if (!certificationId?.trim()) {
    throw new AppError(400, 'CERTIFICATION_ID_REQUIRED', 'Certification ID is required.');
  }

  if (!historyId?.trim()) {
    throw new AppError(400, 'HISTORY_ID_REQUIRED', 'History ID is required.');
  }

  const certification = await prisma.certification.findUnique({
    where: {
      id: certificationId,
    },
    select: certificationDetailSelect,
  });

  if (!certification) {
    throw new AppError(404, 'CERTIFICATION_NOT_FOUND', 'Certification not found.');
  }

  const historyRows = await prisma.$queryRaw<CertificationHistoryRow[]>(Prisma.sql`
    SELECT
      h."id",
      h."certificationId",
      h."action",
      h."levelBefore",
      h."statusBefore",
      h."expiryDateBefore",
      h."notesBefore",
      h."trainingNodeIdBefore",
      h."reason",
      h."changedAt",
      h."changedById",
      u."firstName" AS "changedByFirstName",
      u."lastName" AS "changedByLastName",
      u."email" AS "changedByEmail",
      tn."name" AS "trainingNodeBeforeName",
      tn."type" AS "trainingNodeBeforeType"
    FROM "CertificationHistory" h
    LEFT JOIN "User" u ON u."id" = h."changedById"
    LEFT JOIN "TrainingNode" tn ON tn."id" = h."trainingNodeIdBefore"
    WHERE h."id" = ${historyId}
      AND h."certificationId" = ${certificationId}
    LIMIT 1
  `);

  const history = historyRows[0];

  if (!history) {
    throw new AppError(404, 'CERTIFICATION_HISTORY_NOT_FOUND', 'History entry not found.');
  }

  return {
    certification,
    history: mapHistoricalCertification(history, certification),
  };
};

export {
  getRecentCertifications,
  addCertification,
  getTabularCertifications,
  getCertificationById,
  getCertificationHistoryById,
  getCertificationHistoryEntryById,
  AppError,
};

