/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateCertificationExpiryDate,
  dependencyExpirationReason,
  dueDateExpirationReason,
  isCertificationDue,
} from './certificationLifecycle';

test('new expiry dates use the configured duration without changing older dates', () => {
  const issuedAt = new Date('2026-01-01T12:00:00.000Z');
  assert.equal(
    calculateCertificationExpiryDate(issuedAt, 365).toISOString(),
    '2027-01-01T12:00:00.000Z',
  );
  assert.equal(
    calculateCertificationExpiryDate(issuedAt, 30).toISOString(),
    '2026-01-31T12:00:00.000Z',
  );
});

test('a certification becomes due at its exact expiry instant', () => {
  const expiry = new Date('2026-06-01T00:00:00.000Z');
  assert.equal(isCertificationDue(expiry, new Date('2026-05-31T23:59:59.999Z')), false);
  assert.equal(isCertificationDue(expiry, expiry), true);
  assert.equal(isCertificationDue(null, expiry), false);
});

test('history reasons distinguish due-date and dependency expiration', () => {
  const expiry = new Date('2026-06-01T00:00:00.000Z');
  assert.match(dueDateExpirationReason(expiry), /expiry date/);
  assert.match(dependencyExpirationReason, /prerequisite certification expired/);
});
