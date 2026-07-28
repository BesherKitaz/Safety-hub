/// <reference types="node" />
import assert from 'node:assert/strict';
import test from 'node:test';
import { getReportingPeriodStarts } from './reportingPeriods';

test('reporting periods start at local midnight on the first of the month and Sunday', () => {
  const now = new Date(2026, 6, 28, 15, 42, 11);
  const { startOfMonth, startOfWeek } = getReportingPeriodStarts(now);

  assert.deepEqual(
    [startOfMonth.getFullYear(), startOfMonth.getMonth(), startOfMonth.getDate(), startOfMonth.getHours()],
    [2026, 6, 1, 0],
  );
  assert.deepEqual(
    [startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate(), startOfWeek.getHours()],
    [2026, 6, 26, 0],
  );
});
