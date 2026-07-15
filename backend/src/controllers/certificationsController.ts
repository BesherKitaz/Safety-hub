import { Prisma, UserRole } from '@prisma/client';
import prisma from '../lib/prisma';

type DatabaseClient = Prisma.TransactionClient | typeof prisma;

class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

type CertificationStatus = 'ACTIVE' | 'DEACTIVATED' | 'EXPIRED' | 'REVOKED';
type CertificationHistoryAction = 'CREATED' | 'UPDATED' | 'REVOKED' | 'REACTIVATED' | 'EXPIRED' | 'DEACTIVATED';

type CertificationInput = {
  trainingNodeId: string;
  notes?: string;
  level: number;
  issuedToId: string;
  issuedById: string;
  expiryDate?: string | Date | null;
};

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

type CertificationSnapshot = {
  id: string;
  trainingNodeId: string;
  notes: string | null;
  status: CertificationStatus;
  level: number;
  expiryDate: Date | null;
  issuedAt: Date;
  issuedTo: CertificationPerson;
  issuedBy: CertificationPerson;
  trainingNode: CertificationTrainingNode;
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
  levelAfter: number;
  statusAfter: CertificationStatus;
  expiryDateAfter: Date | null;
  notesAfter: string | null;
  trainingNodeIdAfter: string;
  reason: string | null;
  changedAt: Date;
  changedBy: CertificationPerson;
  trainingNodeBefore: CertificationTrainingNode | null;
  trainingNodeAfter: CertificationTrainingNode | null;
};

type CertificationHistoryResponse = CertificationHistoryRow & {
  certificationSnapshot: CertificationSnapshot;
};

type CertificationValidationContext = {
  issuerRole: UserRole;
  receiverCertifications: CertificationSummary[];
  requestedLevel: number;
  trainingNodeSummary: TrainingNodeSummary;
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
    if (Number.isNaN(value.getTime())) {
      throw new AppError(400, 'INVALID_EXPIRY_DATE', 'Expiry date is invalid.');
    }

    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(400, 'INVALID_EXPIRY_DATE', 'Expiry date is invalid.');
  }

  return parsed;
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
  trainingNodeId: true,
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

const certificationHistorySelectSql = (certificationId: string) => Prisma.sql`
  SELECT
    h."id",
    h."certificationId",
    h."action",
    h."levelBefore",
    h."statusBefore",
    h."expiryDateBefore",
    h."notesBefore",
    h."trainingNodeIdBefore",
    h."levelAfter",
    h."statusAfter",
    h."expiryDateAfter",
    h."notesAfter",
    h."trainingNodeIdAfter",
    h."reason",
    h."changedAt",
    h."changedById",
    u."firstName" AS "changedByFirstName",
    u."lastName" AS "changedByLastName",
    u."email" AS "changedByEmail",
    tnb."id" AS "trainingNodeBeforeId",
    tnb."name" AS "trainingNodeBeforeName",
    tnb."type" AS "trainingNodeBeforeType",
    lnb."id" AS "trainingNodeBeforeLabId",
    lnb."name" AS "trainingNodeBeforeLabName",
    tnbTool."id" AS "trainingNodeBeforeToolId",
    tnbTool."name" AS "trainingNodeBeforeToolName",
    tna."id" AS "trainingNodeAfterId",
    tna."name" AS "trainingNodeAfterName",
    tna."type" AS "trainingNodeAfterType",
    lna."id" AS "trainingNodeAfterLabId",
    lna."name" AS "trainingNodeAfterLabName",
    tnaTool."id" AS "trainingNodeAfterToolId",
    tnaTool."name" AS "trainingNodeAfterToolName"
  FROM "CertificationHistory" h
  LEFT JOIN "User" u ON u."id" = h."changedById"
  LEFT JOIN "TrainingNode" tnb ON tnb."id" = h."trainingNodeIdBefore"
  LEFT JOIN "Lab" lnb ON lnb."id" = tnb."labId"
  LEFT JOIN "Tool" tnbTool ON tnbTool."id" = tnb."toolId"
  LEFT JOIN "TrainingNode" tna ON tna."id" = h."trainingNodeIdAfter"
  LEFT JOIN "Lab" lna ON lna."id" = tna."labId"
  LEFT JOIN "Tool" tnaTool ON tnaTool."id" = tna."toolId"
  WHERE h."certificationId" = ${certificationId}
  ORDER BY h."changedAt" ASC, h."id" ASC
`;

const mapTrainingNodeSnapshot = (row: Record<string, any>, prefix: 'trainingNodeBefore' | 'trainingNodeAfter'): CertificationTrainingNode | null => {
  const id = row[`${prefix}Id`] as string | null;
  const name = row[`${prefix}Name`] as string | null;
  const type = row[`${prefix}Type`] as string | null;

  if (!id || !name || !type) {
    return null;
  }

  return {
    id,
    name,
    type,
    lab: row[`${prefix}LabId`] && row[`${prefix}LabName`]
      ? { id: row[`${prefix}LabId`], name: row[`${prefix}LabName`] }
      : null,
    tool: row[`${prefix}ToolId`] && row[`${prefix}ToolName`]
      ? { id: row[`${prefix}ToolId`], name: row[`${prefix}ToolName`] }
      : null,
  };
};

const mapChangedBy = (row: Record<string, any>): CertificationPerson => {
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

const mapCertificationSnapshot = (certification: any): CertificationSnapshot => ({
  id: certification.id,
  trainingNodeId: certification.trainingNodeId,
  notes: certification.notes,
  status: certification.status,
  level: certification.level,
  expiryDate: certification.expiryDate,
  issuedAt: certification.issuedAt,
  issuedTo: certification.issuedTo,
  issuedBy: certification.issuedBy,
  trainingNode: certification.trainingNode,
});

const mapHistoryRow = (row: Record<string, any>, certification: CertificationSnapshot): CertificationHistoryResponse => {
  const trainingNodeBefore = mapTrainingNodeSnapshot(row, 'trainingNodeBefore');
  const trainingNodeAfter = mapTrainingNodeSnapshot(row, 'trainingNodeAfter');

  return {
    id: row.id,
    certificationId: row.certificationId,
    action: row.action,
    levelBefore: row.levelBefore,
    statusBefore: row.statusBefore,
    expiryDateBefore: row.expiryDateBefore,
    notesBefore: row.notesBefore,
    trainingNodeIdBefore: row.trainingNodeIdBefore,
    levelAfter: row.levelAfter,
    statusAfter: row.statusAfter,
    expiryDateAfter: row.expiryDateAfter,
    notesAfter: row.notesAfter,
    trainingNodeIdAfter: row.trainingNodeIdAfter,
    reason: row.reason,
    changedAt: row.changedAt,
    changedBy: mapChangedBy(row),
    trainingNodeBefore,
    trainingNodeAfter,
    certificationSnapshot: {
      id: row.certificationId,
      trainingNodeId: row.trainingNodeIdAfter,
      notes: row.notesAfter,
      status: row.statusAfter,
      level: row.levelAfter,
      expiryDate: row.expiryDateAfter,
      issuedAt: row.changedAt,
      issuedTo: null,
      issuedBy: null,
      trainingNode: trainingNodeAfter ?? certification.trainingNode,
    },
  };
};

const getRecentCertifications = async () => {
  return prisma.certification.findMany({
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
};


const getTabularCertifications = async (
  skip: number,
  pageSize: number,
  status: CertificationStatus | boolean | number = 'ACTIVE'
) => {
  const normalizedStatus: CertificationStatus =
    status === false || status === 0 || status === 'REVOKED'
      ? 'REVOKED'
      : status === 'DEACTIVATED'
        ? 'DEACTIVATED'
        : status === 'EXPIRED'
          ? 'EXPIRED'
          : 'ACTIVE';
  const certifications = await prisma.certification.findMany({
    skip,
    take: pageSize,
    where: {
      status: normalizedStatus,
    },
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
      level: true,
    },
  });

  const certificationIds = certifications.map((cert: any) => cert.id);

  const latestHistoryRows = await selectCertificationHistoryRowsForTabular(certificationIds);

  const latestHistoryByCertId = new Map(
    latestHistoryRows.map((history: { certificationId: string; changedAt: Date }) => [history.certificationId, history.changedAt])
  );

  return certifications.map((cert: any) => ({
    ...cert,
    lastUpdated: latestHistoryByCertId.get(cert.id) ?? cert.issuedAt,
  }));
};

const selectCertificationHistoryRowsForTabular = async (certificationIds: string[]) => {
  if (certificationIds.length === 0) {
    return [] as { certificationId: string; changedAt: Date }[];
  }

  return (await prisma.$queryRaw(Prisma.sql`
    SELECT DISTINCT ON (h."certificationId")
      h."certificationId",
      h."changedAt"
    FROM "CertificationHistory" h
    WHERE h."certificationId" IN (${Prisma.join(certificationIds)})
    ORDER BY h."certificationId", h."changedAt" DESC, h."id" DESC
  `)) as { certificationId: string; changedAt: Date }[];
};

const getCertificationValidationContext = async (
  proposal: CertificationInput,
  excludeCertificationId?: string,
  db: DatabaseClient = prisma
): Promise<CertificationValidationContext> => {
  const issuer = await db.user.findUnique({
    where: {
      id: proposal.issuedById,
    },
    select: {
      role: true,
    },
  });

  const issuerRole = issuer?.role;
  if (!issuerRole) {
    throw new AppError(404, 'ISSUER_NOT_FOUND', 'Actor not found.');
  }

  const receiverCertifications = await db.certification.findMany({
    where: {
      issuedToId: proposal.issuedToId,
      ...(excludeCertificationId
        ? { id: { not: excludeCertificationId } }
        : {}),
    },
    select: {
      trainingNodeId: true,
      level: true,
      status: true,
    },
  });

  const trainingNode = await db.trainingNode.findUnique({
    where: {
      id: proposal.trainingNodeId,
    },
    select: {
      id: true,
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
    throw new AppError(404, 'TRAINING_NODE_NOT_FOUND', 'Training node not found.');
  }

  return {
    issuerRole,
    receiverCertifications,
    requestedLevel: proposal.level,
    trainingNodeSummary: {
      id: trainingNode.id,
      parents: trainingNode.parentEdges.map((edge) => ({ id: edge.parentId })),
      children: trainingNode.childEdges.map((edge) => ({ id: edge.childId })),
    },
  };
};

const validateCertificationProposal = async (
  proposal: CertificationInput,
  excludeCertificationId?: string,
  db: DatabaseClient = prisma
) => {
  if (!proposal.trainingNodeId) {
    throw new AppError(400, 'TRAINING_NODE_REQUIRED', 'Training node is required.');
  }

  if (!proposal.issuedToId) {
    throw new AppError(400, 'ISSUED_TO_REQUIRED', 'Issued to is required.');
  }

  if (!proposal.issuedById) {
    throw new AppError(400, 'ISSUER_REQUIRED', 'Issuer is required.');
  }

  if (
    !Number.isInteger(proposal.level) ||
    proposal.level < 1 ||
    proposal.level > 3
  ) {
    throw new AppError(
      400,
      'INVALID_CERTIFICATION_LEVEL',
      'Certification level must be 1, 2, or 3.'
    );
  }

  const context = await getCertificationValidationContext(proposal, excludeCertificationId, db);
  const duplicate = await db.certification.findFirst({
    where: {
      issuedToId: proposal.issuedToId,
      trainingNodeId: proposal.trainingNodeId,
      level: proposal.level,
      ...(excludeCertificationId
        ? { id: { not: excludeCertificationId } }
        : {}),
    },
    select: {
      id: true,
    },
  });

  if (duplicate) {
    throw new AppError(409, 'DUPLICATE_CERTIFICATION', 'This certification already exists for this student, training node, and level.');
  }

  if (context.requestedLevel === 1) {
    if (context.trainingNodeSummary.parents.length !== 0) {
      const hasParentRequirement = context.trainingNodeSummary.parents.some((parent) =>
        context.receiverCertifications.some(
          (cert) => cert.trainingNodeId === parent.id && cert.status === 'ACTIVE'
        )
      );

      if (!hasParentRequirement) {
        throw new AppError(400, 'PARENT_CERTIFICATION_REQUIRED', 'A parent certification is required for level 1.');
      }
    }
  }

  if (context.requestedLevel > 1) {
    const allChildrenSatisfied = context.trainingNodeSummary.children.every((child) =>
      context.receiverCertifications.some(
        (cert) =>
          cert.trainingNodeId === child.id &&
          cert.status === 'ACTIVE' &&
          cert.level >= context.requestedLevel
      )
    );

    const hasPredecessorLevelCertifications = context.receiverCertifications.some(
      (cert) => cert.status === 'ACTIVE' && cert.level === context.requestedLevel - 1 && cert.trainingNodeId === context.trainingNodeSummary.id
    );

    if (!allChildrenSatisfied || !hasPredecessorLevelCertifications) {
      throw new AppError(400, 'PREVIOUS_LEVEL_CERTIFICATION_REQUIRED', 'Previous level certification requirements were not met.');
    }
  }

  if (context.requestedLevel > 2 && context.issuerRole !== 'ADMIN') {
    throw new AppError(403, 'INSUFFICIENT_PRIVILEGES', 'Only admins may issue level 3 certifications.');
  }

  if (context.requestedLevel > 1 && context.requestedLevel <= 2 && context.issuerRole !== 'ADMIN' && context.issuerRole !== 'SUPERVISOR') {
    throw new AppError(403, 'INSUFFICIENT_PRIVILEGES', 'Only admins or supervisors may issue this certification level.');
  }

  if (context.requestedLevel === 1 && context.issuerRole !== 'ADMIN' && context.issuerRole !== 'STAFF' && context.issuerRole !== 'SUPERVISOR' && context.issuerRole !== 'MENTOR') {
    throw new AppError(403, 'INSUFFICIENT_PRIVILEGES', 'You do not have permission to issue this certification level.');
  }

  return context;
};

const getCertificationById = async (certificationId: string) => {
  return prisma.certification.findUnique({
    where: {
      id: certificationId,
    },
    select: certificationDetailSelect,
  });
};

const createHistoryEntry = async (
  tx: Prisma.TransactionClient,
  certification: CertificationSnapshot,
  action: CertificationHistoryAction,
  changedById: string,
  reason: string | null = null,
  before?: CertificationSnapshot | null
) => {
  const previous = before ?? certification;

  return tx.certificationHistory.create({
    data: {
      certificationId: certification.id,

      levelBefore: previous.level,
      statusBefore: previous.status,
      expiryDateBefore: previous.expiryDate,
      notesBefore: previous.notes,
      trainingNodeIdBefore: previous.trainingNodeId,

      levelAfter: certification.level,
      statusAfter: certification.status,
      expiryDateAfter: certification.expiryDate,
      notesAfter: certification.notes,
      trainingNodeIdAfter: certification.trainingNodeId,

      action,
      changedById,
      reason,
    },
  });
};

const addCertification = async (certification: CertificationInput) => {
  await validateCertificationProposal(certification);
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
        select: certificationDetailSelect,
      });

      await createHistoryEntry(tx, createdCertification as CertificationSnapshot, 'CREATED', certification.issuedById, null);

      return createdCertification;
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error?.code === 'P2002') {
      throw new AppError(409, 'DUPLICATE_CERTIFICATION', 'This certification already exists for this student, training node, and level.');
    }

    console.error('Failed to create certification:', error);
    throw new AppError(500, 'CERTIFICATION_CREATE_FAILED', 'Something went wrong while creating the certification.');
  }
};

const updateCertification = async (certificationId: string, updateData: Partial<CertificationInput>, changedById: string) => {
  if (!certificationId?.trim()) {
    throw new AppError(400, 'CERTIFICATION_ID_REQUIRED', 'Certification ID is required.');
  }

  const existing = await getCertificationById(certificationId);
  if (!existing) {
    throw new AppError(404, 'CERTIFICATION_NOT_FOUND', 'Certification not found.');
  }

  if (existing.status === 'REVOKED') {
    throw new AppError(409, 'CERTIFICATION_ALREADY_REVOKED', 'Revoked certifications must be unrevoked before they can be modified.');
  }

  const proposalNotes = updateData.notes ?? existing.notes;
  const proposal: CertificationInput = {
    trainingNodeId: updateData.trainingNodeId ?? existing.trainingNodeId,
    ...(proposalNotes !== null && proposalNotes !== undefined
      ? { notes: proposalNotes }
      : {}),
    level: typeof updateData.level === 'number' ? updateData.level : existing.level,
    issuedToId: updateData.issuedToId ?? existing.issuedTo.id,
    issuedById: changedById,
    expiryDate: updateData.expiryDate ?? existing.expiryDate,
  };

  await validateCertificationProposal(proposal, certificationId);

  const normalizedExpiry = normalizeOptionalDate(proposal.expiryDate);
  const normalizedNotes = normalizeOptionalText(proposal.notes);

  try {
    return await prisma.$transaction(async (tx) => {
      const updatedCertification = await tx.certification.update({
        where: { id: certificationId },
        data: {
          trainingNodeId: proposal.trainingNodeId,
          notes: normalizedNotes,
          level: proposal.level,
          issuedToId: proposal.issuedToId,
          expiryDate: normalizedExpiry,
        },
        select: certificationDetailSelect,
      });

      await createHistoryEntry(tx, updatedCertification as CertificationSnapshot, 'UPDATED', changedById, null, existing as CertificationSnapshot);

      return updatedCertification;
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error?.code === 'P2002') {
      throw new AppError(409, 'DUPLICATE_CERTIFICATION', 'This certification already exists for this student, training node, and level.');
    }

    console.error('Failed to update certification:', error);
    throw new AppError(500, 'CERTIFICATION_UPDATE_FAILED', 'Something went wrong while updating the certification.');
  }
};

type RevocationTask = {
  nodeId: string;
  level: 1 | 2 | 3;
};

const buildEdgeMaps = (edges: { parentId: string; childId: string }[]) => {
  const parentsByChild = new Map<string, string[]>();
  const childrenByParent = new Map<string, string[]>();

  for (const edge of edges) {
    const currentParents = parentsByChild.get(edge.childId) ?? [];
    currentParents.push(edge.parentId);
    parentsByChild.set(edge.childId, currentParents);

    const currentChildren = childrenByParent.get(edge.parentId) ?? [];
    currentChildren.push(edge.childId);
    childrenByParent.set(edge.parentId, currentChildren);
  }

  return {
    parentsByChild,
    childrenByParent,
  };
};

const revokeCertification = async (certificationId: string, changedById: string) => {
  if (!certificationId?.trim()) {
    throw new AppError(400, 'CERTIFICATION_ID_REQUIRED', 'Certification ID is required.');
  }

  if (!changedById?.trim()) {
    throw new AppError(400, 'CHANGED_BY_ID_REQUIRED', 'The user performing this action is required.');
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const rootCertification = await tx.certification.findUnique({
        where: { id: certificationId },
        select: certificationDetailSelect,
      });

      if (!rootCertification) {
        throw new AppError(404, 'CERTIFICATION_NOT_FOUND', 'Certification not found.');
      }

      if (rootCertification.status === 'REVOKED') {
        throw new AppError(409, 'CERTIFICATION_ALREADY_REVOKED', 'Certification is already revoked.');
      }

      if (rootCertification.status !== 'ACTIVE') {
        throw new AppError(409, 'CERTIFICATION_NOT_ACTIVE', 'Only active certifications can be revoked.');
      }

      const holderId = rootCertification.issuedTo.id;
      const allHolderCerts = await tx.certification.findMany({
        where: { issuedToId: holderId },
        select: certificationDetailSelect,
      });

      const allEdges = await tx.trainingEdge.findMany({
        select: {
          parentId: true,
          childId: true,
        },
      });

      const { parentsByChild, childrenByParent } = buildEdgeMaps(allEdges);
      const certByNodeLevel = new Map<string, CertificationSnapshot>();

      for (const cert of allHolderCerts as CertificationSnapshot[]) {
        certByNodeLevel.set(`${cert.trainingNodeId}:${cert.level}`, cert);
      }

      const queue: RevocationTask[] = [{ nodeId: rootCertification.trainingNodeId, level: rootCertification.level as 1 | 2 | 3 }];
      const processedTasks = new Set<string>();

      const getCert = (nodeId: string, level: 1 | 2 | 3) => certByNodeLevel.get(`${nodeId}:${level}`) ?? null;

      const revokeCert = async (cert: CertificationSnapshot | null, action: CertificationHistoryAction, before?: CertificationSnapshot | null) => {
        if (!cert) {
          return null;
        }

        if (cert.status === 'REVOKED') {
          return null;
        }

        const updated = await tx.certification.update({
          where: { id: cert.id },
          data: { status: 'REVOKED' },
          select: certificationDetailSelect,
        });

        const updatedSnapshot = updated as CertificationSnapshot;
        certByNodeLevel.set(`${updatedSnapshot.trainingNodeId}:${updatedSnapshot.level}`, updatedSnapshot);

        await createHistoryEntry(tx, updatedSnapshot, action, changedById, null, before ?? cert);
        return updatedSnapshot;
      };

      while (queue.length > 0) {
        const task = queue.shift()!;
        const taskKey = `${task.nodeId}:${task.level}`;

        if (processedTasks.has(taskKey)) {
          continue;
        }
        processedTasks.add(taskKey);

        const current = getCert(task.nodeId, task.level);
        if (!current) {
          continue;
        }

        if (task.level === 1) {
          const changed = await revokeCert(current, 'REVOKED');
          if (!changed) {
            continue;
          }

          const childNodes = childrenByParent.get(task.nodeId) ?? [];
          for (const childNodeId of childNodes) {
            const childLevel1 = getCert(childNodeId, 1);
            if (childLevel1?.status !== 'ACTIVE') {
              continue;
            }

            const parentNodes = parentsByChild.get(childNodeId) ?? [];
            const hasAnyActiveParent = parentNodes.some((parentNodeId) => {
              const parentCert = getCert(parentNodeId, 1);
              return parentCert?.status === 'ACTIVE';
            });

            if (!hasAnyActiveParent) {
              queue.push({ nodeId: childNodeId, level: 1 });
            }
          }

          const sameNodeLevel2 = getCert(task.nodeId, 2);
          if (sameNodeLevel2?.status === 'ACTIVE') {
            queue.push({ nodeId: task.nodeId, level: 2 });
          }

          continue;
        }

        if (task.level === 2) {
          const changed = await revokeCert(current, 'REVOKED');
          if (!changed) {
            continue;
          }

          const sameNodeLevel3 = getCert(task.nodeId, 3);
          if (sameNodeLevel3?.status === 'ACTIVE') {
            queue.push({ nodeId: task.nodeId, level: 3 });
          }

          const parentNodes = parentsByChild.get(task.nodeId) ?? [];
          for (const parentNodeId of parentNodes) {
            const parentLevel2 = getCert(parentNodeId, 2);
            if (parentLevel2?.status === 'ACTIVE') {
              queue.push({ nodeId: parentNodeId, level: 2 });
            }
          }

          continue;
        }

        const changed = await revokeCert(current, 'REVOKED');
        if (!changed) {
          continue;
        }

        const parentNodes = parentsByChild.get(task.nodeId) ?? [];
        for (const parentNodeId of parentNodes) {
          const parentLevel3 = getCert(parentNodeId, 3);
          if (parentLevel3?.status === 'ACTIVE') {
            queue.push({ nodeId: parentNodeId, level: 3 });
          }
        }
      }

      return tx.certification.findUnique({
        where: { id: certificationId },
        select: certificationDetailSelect,
      });
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error('Failed to revoke certification:', error);
    throw new AppError(500, 'CERTIFICATION_REVOKE_FAILED', 'Something went wrong while revoking the certification.');
  }
};

const unrevokeCertification = async (certificationId: string, changedById: string) => {
  if (!certificationId?.trim()) {
    throw new AppError(400, 'CERTIFICATION_ID_REQUIRED', 'Certification ID is required.');
  }

  if (!changedById?.trim()) {
    throw new AppError(400, 'CHANGED_BY_ID_REQUIRED', 'The user performing this action is required.');
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.certification.findUnique({
        where: { id: certificationId },
        select: certificationDetailSelect,
      });

      if (!existing) {
        throw new AppError(404, 'CERTIFICATION_NOT_FOUND', 'Certification not found.');
      }

      if (existing.status === 'ACTIVE') {
        throw new AppError(409, 'CERTIFICATION_ALREADY_ACTIVE', 'Certification is already active.');
      }

      if (existing.status !== 'REVOKED') {
        throw new AppError(409, 'CERTIFICATION_NOT_REVOKED', 'Only revoked certifications can be unrevoked.');
      }

      const proposal: CertificationInput = {
        trainingNodeId: existing.trainingNodeId,
        ...(existing.notes !== null ? { notes: existing.notes } : {}),
        level: existing.level,
        issuedToId: existing.issuedTo.id,
        issuedById: changedById,
        expiryDate: existing.expiryDate,
      };

      await validateCertificationProposal(proposal, certificationId, tx);

      const updated = await tx.certification.update({
        where: { id: certificationId },
        data: {
          status: 'ACTIVE',
        },
        select: certificationDetailSelect,
      });

      await createHistoryEntry(tx, updated as CertificationSnapshot, 'REACTIVATED', changedById, null, existing as CertificationSnapshot);

      return updated;
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error?.code === 'P2002') {
      throw new AppError(409, 'DUPLICATE_CERTIFICATION', 'This certification already exists for this student, training node, and level.');
    }
    throw new AppError(500, 'CERTIFICATION_UNREVOKE_FAILED', error);
  }
};

const getCertificationHistoryById = async (certificationId: string) => {
  if (!certificationId?.trim()) {
    throw new AppError(400, 'CERTIFICATION_ID_REQUIRED', 'Certification ID is required.');
  }

  const certification = await getCertificationById(certificationId);
  if (!certification) {
    throw new AppError(404, 'CERTIFICATION_NOT_FOUND', 'Certification not found.');
  }

  const historyRows = (await prisma.$queryRaw(certificationHistorySelectSql(certificationId))) as CertificationHistoryRow[];

  return {
    certification: mapCertificationSnapshot(certification),
    historyRecords: historyRows.map((row: any) => mapHistoryRow(row, mapCertificationSnapshot(certification))),
  };
};

const getCertificationHistoryEntryById = async (certificationId: string, historyId: string) => {
  if (!certificationId?.trim()) {
    throw new AppError(400, 'CERTIFICATION_ID_REQUIRED', 'Certification ID is required.');
  }

  if (!historyId?.trim()) {
    throw new AppError(400, 'HISTORY_ID_REQUIRED', 'History ID is required.');
  }

  const certification = await getCertificationById(certificationId);
  if (!certification) {
    throw new AppError(404, 'CERTIFICATION_NOT_FOUND', 'Certification not found.');
  }

  const historyRows = (await prisma.$queryRaw(certificationHistorySelectSql(certificationId))) as CertificationHistoryRow[];
  const history = historyRows.find((row: CertificationHistoryRow) => row.id === historyId);
  if (!history) {
    throw new AppError(404, 'CERTIFICATION_HISTORY_NOT_FOUND', 'History entry not found.');
  }

  return {
    certification: mapCertificationSnapshot(certification),
    history: mapHistoryRow(history as any, mapCertificationSnapshot(certification)),
  };
};

export {
  getRecentCertifications,
  addCertification,
  updateCertification,
  revokeCertification,
  unrevokeCertification,
  getTabularCertifications,
  getCertificationById,
  getCertificationHistoryById,
  getCertificationHistoryEntryById,
  AppError,
};

