import { TrainingNodeType } from '@prisma/client/index-browser';
import prisma from '../lib/prisma';
import { AppError, assertLabIsActive } from './labsControllers';
import { findProposedTrainingCycle } from '../util/trainingGraph';

const prismaAny = prisma as any;

type TrainingNodeData = {
    labId: string;
    type: TrainingNodeType;
    toolId?: string;
    parentTrainingNodeIds: string[];
    childTrainingNodeIds: string[];
    name: string;
    description?: string;
};

const supportedTrainingNodeTypes = new Set<TrainingNodeType>([
  TrainingNodeType.GENERAL,
  TrainingNodeType.TOOL,
]);

const isTrainingNodeType = (value: unknown): value is TrainingNodeType =>
  supportedTrainingNodeTypes.has(value as TrainingNodeType);

// Validate primitive request fields before performing relationship queries.
const validateTrainingRequestShape: (data: unknown) => asserts data is TrainingNodeData = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new AppError(400, 'INVALID_TRAINING_REQUEST', 'Training details must be provided.');
  }

  const request = data as Record<string, unknown>;

  if (typeof request.name !== 'string' || !request.name.trim()) {
    throw new AppError(400, 'NAME_REQUIRED', 'Training name is required.');
  }

  if (typeof request.labId !== 'string' || !request.labId.trim()) {
    throw new AppError(400, 'LAB_REQUIRED', 'Lab is required.');
  }

  if (!isTrainingNodeType(request.type)) {
    throw new AppError(400, 'INVALID_TRAINING_TYPE', 'Please select a valid training type.');
  }

  for (const field of ['parentTrainingNodeIds', 'childTrainingNodeIds'] as const) {
    const ids = request[field];
    if (
      !Array.isArray(ids) ||
      ids.some((id) => typeof id !== 'string' || !id.trim())
    ) {
      throw new AppError(
        400,
        'INVALID_RELATED_NODES',
        'Parent and child training nodes must be submitted as valid selections.'
      );
    }
  }

  if (
    request.toolId !== undefined &&
    request.toolId !== null &&
    typeof request.toolId !== 'string'
  ) {
    throw new AppError(400, 'INVALID_TOOL', 'Please select a valid tool.');
  }

  if (
    request.description !== undefined &&
    request.description !== null &&
    typeof request.description !== 'string'
  ) {
    throw new AppError(400, 'INVALID_DESCRIPTION', 'Training description must be text.');
  }
};


const getTrainingsofLab = async (labId: string) => {
    return prismaAny.trainingNode.findMany({
        where: {
            labId,
        },
    });
};


const getTrainingNamesAndIdsByLab = async (labId: string) => {
    return prismaAny.trainingNode.findMany({
        where: {
            labId,
        },
        select: {
            id: true,
            name: true,
            type: true,
            labId: true,
            isActive: true,
            childEdges: {
              select: {
                childId: true,
              },
            },
        },
    });
};

// Descendant collection supports cascade checks when training relationships change.
const collectDescendantTrainingIds = async (trainingId: string) => {
  const visited = new Set<string>();
  const descendants = new Set<string>();
  const stack = [trainingId];

  while (stack.length > 0) {
    const currentId = stack.pop()!;

    if (visited.has(currentId)) {
      continue;
    }

    visited.add(currentId);

    const edges = await prismaAny.trainingEdge.findMany({
      where: { parentId: currentId },
      select: { childId: true },
    });

    for (const edge of edges) {
      if (!descendants.has(edge.childId)) {
        descendants.add(edge.childId);
        stack.push(edge.childId);
      }
    }
  }

  descendants.delete(trainingId);
  return [...descendants];
};

const unique = (values: string[]) => [...new Set(values)];

const normalizeOptionalId = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();

  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
    return null;
  }

  return trimmed;
};

// Clear both incoming and outgoing edges before rebuilding an edited graph node.
const clearTrainingEdges = async (tx: any, trainingId: string) => {
  await tx.trainingEdge.deleteMany({
    where: {
      OR: [{ parentId: trainingId }, { childId: trainingId }],
    },
  });
};

const getTrainingRecord = async (trainingId: string) => {
  return prismaAny.trainingNode.findUnique({
    where: { id: trainingId },
    select: {
      id: true,
      labId: true,
      isActive: true,
      toolId: true,
    },
  });
};

// Validate tools, prerequisite types, dependencies, and graph cycles as one proposal.
const validateTrainingNodeData = async (data: TrainingNodeData, currentTrainingId?: string) => {
  validateTrainingRequestShape(data);

  const parentIds = unique(data.parentTrainingNodeIds);
  const childIds = unique(data.childTrainingNodeIds);

  await assertLabIsActive(data.labId);

  if (
    parentIds.length !== data.parentTrainingNodeIds.length ||
    childIds.length !== data.childTrainingNodeIds.length
  ) {
    throw new AppError(
      400,
      'DUPLICATE_EDGE_INPUT',
      'Duplicate parent or child training nodes were submitted.'
    );
  }

  const overlap = parentIds.some((id) => childIds.includes(id));

  if (overlap) {
    throw new AppError(
      400,
      'NODE_CANNOT_BE_PARENT_AND_CHILD',
      'A training node cannot be both a parent and child of the new node.'
    );
  }

  if (
    currentTrainingId &&
    (parentIds.includes(currentTrainingId) || childIds.includes(currentTrainingId))
  ) {
    throw new AppError(
      400,
      'TRAINING_SELF_RELATION',
      'A training node cannot be related directly to itself.'
    );
  }

  if (data.type === TrainingNodeType.TOOL && !data.toolId) {
    throw new AppError(400, 'TOOL_REQUIRED', 'Tool training nodes require a tool.');
  }

  if (data.type !== TrainingNodeType.TOOL && data.toolId) {
    throw new AppError(400, 'TOOL_NOT_ALLOWED', 'Only tool training nodes can have a tool.');
  }

  if (data.toolId) {
    const tool = await prismaAny.tool.findUnique({
      where: { id: data.toolId },
      include: { trainingNode: true },
    });

    if (!tool) {
      throw new AppError(404, 'TOOL_NOT_FOUND', 'Selected tool was not found.');
    }

    if (tool.labId !== data.labId) {
      throw new AppError(400, 'TOOL_LAB_MISMATCH', 'Selected tool does not belong to the selected lab.');
    }

    if (!tool.isActive) {
      throw new AppError(409, 'TOOL_INACTIVE', 'Selected tool is inactive and cannot be assigned.');
    }

    if (tool.trainingNode && tool.trainingNode.id !== currentTrainingId) {
      throw new AppError(409, 'TOOL_ALREADY_HAS_TRAINING', 'This tool already has a training node.');
    }
  }

  const relatedNodeIds = unique([...parentIds, ...childIds]);

  const relatedNodes = await prismaAny.trainingNode.findMany({
    where: {
      id: {
        in: relatedNodeIds,
      },
    },
    select: {
      id: true,
      labId: true,
      isActive: true,
    },
  });

  if (relatedNodes.length !== relatedNodeIds.length) {
    throw new AppError(404, 'RELATED_NODE_NOT_FOUND', 'One or more selected parent/child training nodes were not found.');
  }

  const hasDifferentLab = relatedNodes.some((node: any) => node.labId !== data.labId);
  if (hasDifferentLab) {
    throw new AppError(400, 'RELATED_NODE_LAB_MISMATCH', 'Selected parent/child training nodes must belong to the same lab.');
  }

  const hasInactiveRelatedNode = relatedNodes.some((node: any) => node.isActive === false);
  if (hasInactiveRelatedNode) {
    throw new AppError(409, 'RELATED_NODE_INACTIVE', 'Selected parent/child training nodes are inactive and cannot be modified.');
  }

  const graphNodes = await prismaAny.trainingNode.findMany({
    where: { labId: data.labId },
    select: {
      id: true,
      name: true,
      childEdges: {
        select: {
          parentId: true,
          childId: true,
        },
      },
    },
  });
  const graphEdges = graphNodes.flatMap((node: any) => node.childEdges);
  const proposedCycle = findProposedTrainingCycle(
    graphEdges,
    parentIds,
    childIds,
    currentTrainingId,
  );

  if (proposedCycle) {
    const namesById = new Map<string, string>(
      graphNodes.map((node: any) => [node.id, node.name]),
    );
    const currentName = data.name.trim() || 'This training';
    const cyclePath = [
      namesById.get(proposedCycle.parentId) ?? proposedCycle.parentId,
      currentName,
      ...proposedCycle.existingPath.map(
        (id) => namesById.get(id) ?? id,
      ),
    ].join(' → ');

    throw new AppError(
      409,
      'TRAINING_GRAPH_CYCLE',
      `This relationship would create a cycle: ${cyclePath}. That would make "${currentName}" indirectly depend on itself.`
    );
  }

  return { parentIds, childIds };
};

// Persist a validated node and all of its graph relationships atomically.
const addTraining = async (trainingData: TrainingNodeData) => {
  const { parentIds, childIds } = await validateTrainingNodeData(trainingData);

  try {
    return await prismaAny.$transaction(async (tx: any) => {
      const toolId = normalizeOptionalId(trainingData.toolId);

      const trainingNode = await tx.trainingNode.create({
        data: {
          name: trainingData.name.trim(),
          type: trainingData.type,
          lab: {
            connect: { id: trainingData.labId },
          },
          ...(toolId
            ? {
                tool: {
                  connect: { id: toolId },
                },
              }
            : {}),
        },
      });

      const edgesToCreate = [
        ...parentIds.map((parentId: string) => ({ parentId, childId: trainingNode.id })),
        ...childIds.map((childId: string) => ({ parentId: trainingNode.id, childId })),
      ];

      if (edgesToCreate.length > 0) {
        await tx.trainingEdge.createMany({
          data: edgesToCreate,
          skipDuplicates: true,
        });
      }

      return trainingNode;
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error.code === 'P2002') {
      throw new AppError(409, 'UNIQUE_CONSTRAINT_FAILED', 'A unique constraint was violated. This tool may already have a training node.');
    }

    throw new AppError(500, 'TRAINING_CREATE_FAILED', 'Something went wrong while creating the training node.');
  }
};

const getTrainingById = async (trainingId: string) => {
  try {
    return await prismaAny.trainingNode.findUnique({
      where: { id: trainingId },
      include: {
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
        parentEdges: {
          select: {
            parent: {
              select: {
                id: true,
                name: true,
                type: true,
                isActive: true,
                childEdges: {
                  select: {
                    child: {
                      select: {
                        id: true,
                        name: true,
                        type: true,
                        isActive: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        childEdges: {
          select: {
            child: {
              select: {
                id: true,
                name: true,
                type: true,
                isActive: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    throw new AppError(500, 'TRAINING_FETCH_FAILED', 'Something went wrong while fetching the training node.');
  }
};

// Update the node and replace its relationships in a single transaction.
const updateTraining = async (trainingId: string, updateData: TrainingNodeData) => {
  const currentTraining = await getTrainingRecord(trainingId);

  if (!currentTraining) {
    throw new AppError(404, 'TRAINING_NOT_FOUND', 'Training node not found.');
  }

  if (!currentTraining.isActive) {
    throw new AppError(409, 'TRAINING_INACTIVE', 'This training node is inactive and cannot be modified.');
  }

  const { parentIds, childIds } = await validateTrainingNodeData(updateData, trainingId);

  try {
    return await prismaAny.$transaction(async (tx: any) => {
      const toolId = normalizeOptionalId(updateData.toolId);

      const updatedTraining = await tx.trainingNode.update({
        where: { id: trainingId },
        data: {
          name: updateData.name.trim(),
          type: updateData.type,
          lab: {
            connect: { id: updateData.labId },
          },
          tool: toolId
            ? {
                connect: { id: toolId },
              }
            : {
                disconnect: true,
              },
        },
      });

      await clearTrainingEdges(tx, trainingId);

      const edgesToCreate = [
        ...parentIds.map((parentId: string) => ({ parentId, childId: updatedTraining.id })),
        ...childIds.map((childId: string) => ({ parentId: updatedTraining.id, childId })),
      ];

      if (edgesToCreate.length > 0) {
        await tx.trainingEdge.createMany({
          data: edgesToCreate,
          skipDuplicates: true,
        });
      }

      return updatedTraining;
    });
  } catch (error: any) {
    console.error('Error updating training:', error);
    if (error instanceof AppError) {
      throw error;
    }

    if (error.code === 'P2002') {
      throw new AppError(409, 'UNIQUE_CONSTRAINT_FAILED', 'A unique constraint was violated. This tool may already have a training node.');
    }

    throw new AppError(500, 'TRAINING_UPDATE_FAILED', 'Something went wrong while updating the training node.');
  }
};

const deactivateTraining = async (trainingId: string) => {
  const currentTraining = await getTrainingRecord(trainingId);

  if (!currentTraining) {
    throw new AppError(404, 'TRAINING_NOT_FOUND', 'Training node not found.');
  }

  if (!currentTraining.isActive) {
    throw new AppError(409, 'TRAINING_ALREADY_INACTIVE', 'Training node is already inactive.');
  }

  await assertLabIsActive(currentTraining.labId);

  const descendantIds = await collectDescendantTrainingIds(trainingId);

  return prismaAny.$transaction(async (tx: any) => {
    const updatedTraining = await tx.trainingNode.update({
      where: { id: trainingId },
      data: { isActive: false },
    });

    if (descendantIds.length > 0) {
      await tx.trainingNode.updateMany({
        where: {
          id: { in: descendantIds },
        },
        data: { isActive: false },
      });
    }

    return updatedTraining;
  });
};

const activateTraining = async (trainingId: string) => {
  const currentTraining = await getTrainingRecord(trainingId);

  if (!currentTraining) {
    throw new AppError(404, 'TRAINING_NOT_FOUND', 'Training node not found.');
  }

  await assertLabIsActive(currentTraining.labId);

  return prismaAny.trainingNode.update({
    where: { id: trainingId },
    data: { isActive: true },
  });
};

export {
  getTrainingsofLab,
  getTrainingNamesAndIdsByLab,
  addTraining,
  getTrainingById,
  updateTraining,
  deactivateTraining,
  activateTraining,
  AppError,
};
