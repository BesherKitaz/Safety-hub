export type TrainingGraphEdge = {
  parentId: string;
  childId: string;
};

export type ProposedTrainingCycle = {
  parentId: string;
  childId: string;
  existingPath: string[];
};

export const findDirectedPath = (
  edges: TrainingGraphEdge[],
  startId: string,
  targetId: string,
): string[] | null => {
  const adjacency = new Map<string, string[]>();

  for (const edge of edges) {
    const children = adjacency.get(edge.parentId) ?? [];
    children.push(edge.childId);
    adjacency.set(edge.parentId, children);
  }

  const queue: string[][] = [[startId]];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const path = queue.shift()!;
    const currentId = path[path.length - 1]!;

    if (currentId === targetId) {
      return path;
    }

    if (visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);

    for (const childId of adjacency.get(currentId) ?? []) {
      if (!visited.has(childId)) {
        queue.push([...path, childId]);
      }
    }
  }

  return null;
};

export const findProposedTrainingCycle = (
  edges: TrainingGraphEdge[],
  parentIds: string[],
  childIds: string[],
  currentTrainingId?: string,
): ProposedTrainingCycle | null => {
  const retainedEdges = currentTrainingId
    ? edges.filter(
        (edge) =>
          edge.parentId !== currentTrainingId &&
          edge.childId !== currentTrainingId,
      )
    : edges;

  for (const parentId of parentIds) {
    for (const childId of childIds) {
      const existingPath = findDirectedPath(retainedEdges, childId, parentId);
      if (existingPath) {
        return { parentId, childId, existingPath };
      }
    }
  }

  return null;
};
