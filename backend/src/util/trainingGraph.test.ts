/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  findDirectedPath,
  findProposedTrainingCycle,
  type TrainingGraphEdge,
} from './trainingGraph';

const edges: TrainingGraphEdge[] = [
  { parentId: 'a', childId: 'b' },
  { parentId: 'b', childId: 'c' },
  { parentId: 'c', childId: 'd' },
];

test('findDirectedPath returns the exact directed path', () => {
  assert.deepEqual(findDirectedPath(edges, 'a', 'd'), ['a', 'b', 'c', 'd']);
  assert.equal(findDirectedPath(edges, 'd', 'a'), null);
});

test('detects the exact path closed by proposed parent and child relationships', () => {
  assert.deepEqual(findProposedTrainingCycle(edges, ['d'], ['a']), {
    parentId: 'd',
    childId: 'a',
    existingPath: ['a', 'b', 'c', 'd'],
  });
});

test('allows unrelated parent and child relationships', () => {
  assert.equal(findProposedTrainingCycle(edges, ['a'], ['d']), null);
});

test('edit validation ignores the current node old edges because they are replaced', () => {
  const editEdges = [
    { parentId: 'parent', childId: 'current' },
    { parentId: 'current', childId: 'child' },
  ];

  assert.equal(
    findProposedTrainingCycle(editEdges, ['parent'], ['child'], 'current'),
    null,
  );
});

test('edit validation still detects paths that do not use the current node', () => {
  const editEdges = [
    { parentId: 'child', childId: 'middle' },
    { parentId: 'middle', childId: 'parent' },
    { parentId: 'old-parent', childId: 'current' },
  ];

  assert.deepEqual(
    findProposedTrainingCycle(editEdges, ['parent'], ['child'], 'current'),
    {
      parentId: 'parent',
      childId: 'child',
      existingPath: ['child', 'middle', 'parent'],
    },
  );
});
