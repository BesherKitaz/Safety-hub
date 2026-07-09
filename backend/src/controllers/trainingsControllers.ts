import { TrainingNodeType } from '@prisma/client/index-browser';
import prisma from '../lib/prisma'



type TrainingNodeData = {
    labId: string
    type: TrainingNodeType
    toolId?: string
    parentTrainingNodeIds: string[]
    childTrainingNodeIds: string[]
    name: string
    description?: string
}

// Custom error class to handle application-specific errors
class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

// Get a training node by its ID
const getTrainingsofLab = async (labId: string) => {
    // Implementation to fetch trainings of a specific lab
    const trainings = await prisma.trainingNode.findMany({
        where: {
            labId: labId
        }
    });
    return trainings;
};

// Get training names and IDs of a specific lab
const getTrainingNamesAndIdsByLab = async (labId: string) => {
    // Implementation to fetch training names and IDs of a specific lab
    const trainings = await prisma.trainingNode.findMany({
        where: {
            labId: labId
        },
        select: {
            id: true,
            name: true
        }
    });
    return trainings;
};

/* BEGIN ADDING NEW TRAINING LOGIC HERE */

// This function checks if there is a path from startNodeId to targetNodeId in the training prerequisite graph.
const hasPath = async (
  startNodeId: string,
  targetNodeId: string
): Promise<boolean> => {
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

    const edges = await prisma.trainingEdge.findMany({
      where: {
        parentId: currentId,
      },
      select: {
        childId: true,
      },
    });

    for (const edge of edges) {
      stack.push(edge.childId);
    }
  }

  return false;
};

const unique = (values: string[]) => [...new Set(values)];


// Ensures data is valid and meets the requirements for adding a new training node, including checking for cycles in the graph.
const validateTrainingNodeData = async (data: TrainingNodeData) => {
  const parentIds = unique(data.parentTrainingNodeIds);
  const childIds = unique(data.childTrainingNodeIds);
  console.log("Validating Training Node Data:", data, "Parent IDs:", parentIds, "Child IDs:", childIds);
  if (!data.name.trim()) {
    throw new AppError(400, "NAME_REQUIRED", "Training name is required.");
  }

  if (!data.labId) {
    throw new AppError(400, "LAB_REQUIRED", "Lab is required.");
  }

  if (
    parentIds.length !== data.parentTrainingNodeIds.length ||
    childIds.length !== data.childTrainingNodeIds.length
  ) {
    throw new AppError(
      400,
      "DUPLICATE_EDGE_INPUT",
      "Duplicate parent or child training nodes were submitted."
    );
  }

  const overlap = parentIds.some((id) => childIds.includes(id));

  if (overlap) {
    throw new AppError(
      400,
      "NODE_CANNOT_BE_PARENT_AND_CHILD",
      "A training node cannot be both a parent and child of the new node."
    );
  }

  if (data.type === TrainingNodeType.TOOL && !data.toolId) {
    throw new AppError(
      400,
      "TOOL_REQUIRED",
      "Tool training nodes require a tool."
    );
  }

  if (data.type !== TrainingNodeType.TOOL && data.toolId) {
    throw new AppError(
      400,
      "TOOL_NOT_ALLOWED",
      "Only tool training nodes can have a tool."
    );
  }

  if (data.toolId) {
    const tool = await prisma.tool.findUnique({
      where: {
        id: data.toolId,
      },
      include: {
        trainingNode: true,
      },
    });

    if (!tool) {
      throw new AppError(404, "TOOL_NOT_FOUND", "Selected tool was not found.");
    }

    if (tool.labId !== data.labId) {
      throw new AppError(
        400,
        "TOOL_LAB_MISMATCH",
        "Selected tool does not belong to the selected lab."
      );
    }

    if (tool.trainingNode) {
      throw new AppError(
        409,
        "TOOL_ALREADY_HAS_TRAINING",
        "This tool already has a training node."
      );
    }
  }

  const relatedNodeIds = unique([...parentIds, ...childIds]);

  const relatedNodes = await prisma.trainingNode.findMany({
    where: {
      id: {
        in: relatedNodeIds,
      },
    },
    select: {
      id: true,
      labId: true,
    },
  });

  if (relatedNodes.length !== relatedNodeIds.length) {
    throw new AppError(
      404,
      "RELATED_NODE_NOT_FOUND",
      "One or more selected parent/child training nodes were not found."
    );
  }

  const hasDifferentLab = relatedNodes.some(
    (node) => node.labId !== data.labId
  );

  if (hasDifferentLab) {
    throw new AppError(
      400,
      "RELATED_NODE_LAB_MISMATCH",
      "Selected parent/child training nodes must belong to the same lab."
    );
  }

  // Main DAG check:
  // We are about to add parent -> newNode -> child.
  // If child already reaches parent, that creates a cycle.
  for (const childId of childIds) {
    for (const parentId of parentIds) {
      const createsCycle = await hasPath(childId, parentId);

      if (createsCycle) {
        throw new AppError(
          409,
          "TRAINING_GRAPH_CYCLE",
          "This connection would create a cycle in the training prerequisite graph."
        );
      }
    }
  }

  return {
    parentIds,
    childIds,
  };
};

// Handle cases where the optional input is empty. It converts empty strings, and undefiend to null, while keeping nulls the same
const normalizeOptionalId = (value: unknown): string | null => {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  if (!trimmed || trimmed === "null" || trimmed === "undefined") {
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

// This function adds a new training node to the database, along with its parent and child edges. 
// It validates the input data, checks for cycles in the graph, and handles unique constraints.
const addTraining = async (trainingData: TrainingNodeData) => {
  const { parentIds, childIds } = await validateTrainingNodeData(trainingData);
  try {
    const result = await prisma.$transaction(async (tx) => {
      const toolId = normalizeOptionalId(trainingData.toolId);

      const trainingNode = await tx.trainingNode.create({
        data: {
          name: trainingData.name.trim(),
          type: trainingData.type,
          lab: {
            connect: {
              id: trainingData.labId,
            },
          },
          ...(toolId
            ? {
                tool: {
                  connect: {
                    id: toolId,
                  },
                },
              }
            : {}),
        },
      });

      const edgesToCreate = [
        ...parentIds.map((parentId: string) => ({
          parentId,
          childId: trainingNode.id,
        })),
        ...childIds.map((childId: string) => ({
          parentId: trainingNode.id,
          childId,
        })),
      ];

      if (edgesToCreate.length > 0) {
        await tx.trainingEdge.createMany({
          data: edgesToCreate,
          skipDuplicates: true,
        });
      }

      return trainingNode;
    });

    return result;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error.code === "P2002") {
      throw new AppError(
        409,
        "UNIQUE_CONSTRAINT_FAILED",
        "A unique constraint was violated. This tool may already have a training node."
      );
    }

    throw new AppError(
      500,
      "TRAINING_CREATE_FAILED",
      "Something went wrong while creating the training node."
    );
  }
};

/* END ADDING TRAINING LOGIC */

const getTrainingById = async (trainingId: string) => {
  try {
    const training = await prisma.trainingNode.findUnique({
        where: {
          id: trainingId
        },
        include: {
          lab: {
            select: {
              id: true,
              name: true,
            }
          },
          tool: {
            select: {
              id: true,
              name: true,
            }
          },
          parentEdges: {
            select: {
              parent: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  childEdges: {
                    select: {
                      child: {
                        select: {
                          id: true,
                          name: true,
                          type: true,
                        }
                      }
                    }
                  }
                }
              }
            },
          },
          childEdges: {
            select: {
              child: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                }
              }
            },
          },
        },
    });

    return training;
    
  } catch (error) {
    throw new AppError(
      500,
      "TRAINING_FETCH_FAILED",
      "Something went wrong while fetching the training node."
    );
  }
};

const updateTraining = async (trainingId: string, updateData: TrainingNodeData) => {
  const { parentIds, childIds } = await validateTrainingNodeData(updateData);
  console.log("Validated training data. Parent IDs:", parentIds, "Child IDs:", childIds);
  try {
    const result = await prisma.$transaction(async (tx) => {
      const toolId = normalizeOptionalId(updateData.toolId);

      const updatedTraining = await tx.trainingNode.update({
        where: { id: trainingId },
        data: {
          name: updateData.name.trim(),
          type: updateData.type,
          lab: {
            connect: {
              id: updateData.labId,
            },
          },
          tool: toolId
            ? {
                connect: {
                  id: toolId,
                },
              }
            : {
                disconnect: true,
              },
        },
      });

      await clearTrainingEdges(tx, trainingId);

      const edgesToCreate = [
        ...parentIds.map((parentId: string) => ({
          parentId,
          childId: updatedTraining.id,
        })),
        ...childIds.map((childId: string) => ({
          parentId: updatedTraining.id,
          childId,
        })),
      ];

      if (edgesToCreate.length > 0) {
        await tx.trainingEdge.createMany({
          data: edgesToCreate,
          skipDuplicates: true,
        });
      }

      return updatedTraining;
    });

    return result;
  } catch (error: any) {
    console.error('Error updating training:', error);
    if (error instanceof AppError) {
      throw error;
    }

    if (error.code === "P2002") {
      throw new AppError(
        409,
        "UNIQUE_CONSTRAINT_FAILED",
        "A unique constraint was violated. This tool may already have a training node."
      );
    }

    throw new AppError(
      500,
      "TRAINING_UPDATE_FAILED",
      "Something went wrong while updating the training node."
    );
  }
};

export { getTrainingsofLab, getTrainingNamesAndIdsByLab, addTraining, getTrainingById, updateTraining, AppError };






