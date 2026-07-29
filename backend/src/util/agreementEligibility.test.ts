/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert/strict';

import { canChangeRole, canReceiveCertification } from './agreementEligibility';

test('certification recipients must complete the agreement', () => {
  assert.equal(canReceiveCertification('issuer', 'recipient', false), false);
  assert.equal(canReceiveCertification('issuer', 'recipient', true), true);
});

test('users cannot certify themselves', () => {
  assert.equal(canReceiveCertification('same-user', 'same-user', true), false);
});

test('an incomplete agreement blocks only actual role changes', () => {
  assert.equal(canChangeRole('STUDENT', 'MENTOR', false), false);
  assert.equal(canChangeRole('STUDENT', 'STUDENT', false), true);
  assert.equal(canChangeRole('STUDENT', 'MENTOR', true), true);
});
