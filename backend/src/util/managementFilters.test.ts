/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeCertificationLevelFilter,
  normalizeCertificationStatusFilter,
  parseOptionalBooleanFilter,
} from './managementFilters';

test('certification levels are normalized from their numeric query values', () => {
  assert.equal(normalizeCertificationLevelFilter('1'), 1);
  assert.equal(normalizeCertificationLevelFilter('3'), 3);
  assert.equal(normalizeCertificationLevelFilter('Basic'), undefined);
  assert.equal(normalizeCertificationLevelFilter('4'), undefined);
});

test('only supported certification statuses are accepted', () => {
  assert.equal(normalizeCertificationStatusFilter('REVOKED'), 'REVOKED');
  assert.equal(normalizeCertificationStatusFilter(''), undefined);
  assert.equal(normalizeCertificationStatusFilter('UNKNOWN'), undefined);
});

test('optional boolean filters preserve false instead of treating it as empty', () => {
  assert.equal(parseOptionalBooleanFilter('true'), true);
  assert.equal(parseOptionalBooleanFilter('false'), false);
  assert.equal(parseOptionalBooleanFilter(''), undefined);
});
