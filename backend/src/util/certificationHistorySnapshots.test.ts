/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildBeforeSnapshotFields } from './certificationHistorySnapshots';

test('creation history has no before-state', () => {
  assert.deepEqual(buildBeforeSnapshotFields(null), {
    levelBefore: null,
    statusBefore: null,
    expiryDateBefore: null,
    notesBefore: null,
    trainingNodeIdBefore: null,
  });
});

test('change history preserves the complete previous state', () => {
  const expiryDate = new Date('2027-01-01T00:00:00.000Z');

  assert.deepEqual(
    buildBeforeSnapshotFields({
      level: 2,
      status: 'ACTIVE',
      expiryDate,
      notes: 'Previous notes',
      trainingNodeId: 'training-1',
    }),
    {
      levelBefore: 2,
      statusBefore: 'ACTIVE',
      expiryDateBefore: expiryDate,
      notesBefore: 'Previous notes',
      trainingNodeIdBefore: 'training-1',
    },
  );
});
