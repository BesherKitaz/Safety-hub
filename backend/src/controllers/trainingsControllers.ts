import { TrainingNodeType } from '@prisma/client/index-browser';
import prisma from '../lib/prisma';
import { AppError, assertLabIsActive } from './labsControllers';

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
            isActive: true,
        },
    });
};


const hasPath = async (startNodeId: string, targetNodeId: string): Promise<boolean> => {
  const visited = new Set<string>();
  const stack = [startNodeId];

  while (stack.length > 0) {
    const currentId = stack.pop()!;

    if (currentId === targetNodeId) {
      return true;
    }

    if (visited.has(currentId)) {
      continue;
    }

    visited.add(currentId);

    const edges = await prismaAny.trainingEdge.findMany({
      where: { parentId: currentId },
      select: { childId: true },
    });

    for (const edge of edges) {
      stack.push(edge.childId);
    }
  }

  return false;
};

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

const validateTrainingNodeData = async (data: TrainingNodeData) => {
  const parentIds = unique(data.parentTrainingNodeIds);
  const childIds = unique(data.childTrainingNodeIds);

  if (!data.name.trim()) {
    throw new AppError(400, 'NAME_REQUIRED', 'Training name is required.');
  }

  if (!data.labId) {
    throw new AppError(400, 'LAB_REQUIRED', 'Lab is required.');
  }

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

    if (tool.trainingNode) {
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

  for (const childId of childIds) {
    for (const parentId of parentIds) {
      const createsCycle = await hasPath(childId, parentId);

      if (createsCycle) {
        throw new AppError(409, 'TRAINING_GRAPH_CYCLE', 'This connection would create a cycle in the training prerequisite graph.');
      }
    }
  }

  return { parentIds, childIds };
};

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

const updateTraining = async (trainingId: string, updateData: TrainingNodeData) => {
  const currentTraining = await getTrainingRecord(trainingId);

  if (!currentTraining) {
    throw new AppError(404, 'TRAINING_NOT_FOUND', 'Training node not found.');
  }

  if (!currentTraining.isActive) {
    throw new AppError(409, 'TRAINING_INACTIVE', 'This training node is inactive and cannot be modified.');
  }

  const { parentIds, childIds } = await validateTrainingNodeData(updateData);

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

