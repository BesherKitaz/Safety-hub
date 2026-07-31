/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';
import { isEmailVerificationBypassed, isPurdueEmail, isPurdueEmailRequirementBypassed } from './emailPolicy';

test('accepts Purdue addresses case-insensitively and rejects other domains', () => {
  assert.equal(isPurdueEmail('student@purdue.edu'), true);
  assert.equal(isPurdueEmail(' Student.Name+lab@PURDUE.EDU '), true);
  assert.equal(isPurdueEmail('student@purdue.edu.example.com'), false);
  assert.equal(isPurdueEmail('student@example.com'), false);
});

test('bypass flags are enabled only by the value true', () => {
  const originalVerification = process.env.BYPASS_EMAIL_VERIFICATION;
  const originalPurdue = process.env.BYPASS_PURDUE_EMAIL_REQUIREMENT;
  try {
    process.env.BYPASS_EMAIL_VERIFICATION = 'TRUE';
    process.env.BYPASS_PURDUE_EMAIL_REQUIREMENT = ' true ';
    assert.equal(isEmailVerificationBypassed(), true);
    assert.equal(isPurdueEmailRequirementBypassed(), true);
    process.env.BYPASS_EMAIL_VERIFICATION = 'false';
    process.env.BYPASS_PURDUE_EMAIL_REQUIREMENT = '1';
    assert.equal(isEmailVerificationBypassed(), false);
    assert.equal(isPurdueEmailRequirementBypassed(), false);
  } finally {
    if (originalVerification === undefined) delete process.env.BYPASS_EMAIL_VERIFICATION;
    else process.env.BYPASS_EMAIL_VERIFICATION = originalVerification;
    if (originalPurdue === undefined) delete process.env.BYPASS_PURDUE_EMAIL_REQUIREMENT;
    else process.env.BYPASS_PURDUE_EMAIL_REQUIREMENT = originalPurdue;
  }
});
