/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert/strict';
import { EDITABLE_PROFILE_FIELDS, getProfileMutationPermissions, type UserRoleName } from './userProfileAuthorization';

const permissions = (actorRole: UserRoleName, targetRole: UserRoleName, self = false) =>
  getProfileMutationPermissions({ id: 'actor', role: actorRole }, { id: self ? 'actor' : 'target', role: targetRole });

test('students and supervisors can edit only their own basic fields', () => {
  assert.equal(permissions('STUDENT', 'STUDENT', true).basic, true);
  assert.equal(permissions('STUDENT', 'MENTOR').basic, false);
  assert.equal(permissions('SUPERVISOR', 'SUPERVISOR', true).basic, true);
  assert.equal(permissions('STUDENT', 'STUDENT', true).identity, false);
});

test('mentor and supervisor agreement exceptions are applied only to other permitted users', () => {
  assert.equal(permissions('MENTOR', 'MENTOR').agreement, true);
  assert.equal(permissions('MENTOR', 'MENTOR', true).agreement, false);
  assert.equal(permissions('SUPERVISOR', 'MENTOR').agreement, true);
  assert.equal(permissions('SUPERVISOR', 'STAFF').agreement, false);
});

test('staff can manage only student, mentor, and supervisor accounts', () => {
  for (const role of ['STUDENT', 'MENTOR', 'SUPERVISOR'] as const) {
    const result = permissions('STAFF', role);
    assert.equal(result.basic, true);
    assert.equal(result.role, true);
    assert.equal(result.active, true);
    assert.deepEqual(result.assignableRoles, ['STUDENT', 'MENTOR', 'SUPERVISOR']);
  }
  assert.equal(permissions('STAFF', 'STAFF').basic, false);
  assert.equal(permissions('STAFF', 'ADMIN').basic, false);
  assert.equal(permissions('STAFF', 'STAFF', true).active, false);
  assert.equal(permissions('STAFF', 'STUDENT').assignableRoles.includes('STAFF'), false);
  assert.equal(permissions('STAFF', 'STUDENT').assignableRoles.includes('MENTOR'), true);
  assert.equal(permissions('STAFF', 'MENTOR').assignableRoles.includes('SUPERVISOR'), true);
});

test('immutable and secret fields are excluded from the update allowlist', () => {
  assert.equal((EDITABLE_PROFILE_FIELDS as readonly string[]).includes('id'), false);
  assert.equal((EDITABLE_PROFILE_FIELDS as readonly string[]).includes('passwordHash'), false);
  assert.equal((EDITABLE_PROFILE_FIELDS as readonly string[]).includes('createdAt'), false);
  assert.equal((EDITABLE_PROFILE_FIELDS as readonly string[]).includes('updatedAt'), false);
});

test('admins can manage every other account but never their own protected fields or status', () => {
  for (const role of ['ADMIN', 'STAFF', 'SUPERVISOR', 'MENTOR', 'STUDENT'] as const) {
    const result = permissions('ADMIN', role);
    assert.equal(result.basic && result.identity && result.role && result.active, true);
    assert.equal(result.assignableRoles.includes('ADMIN'), true);
  }
  const self = permissions('ADMIN', 'ADMIN', true);
  assert.equal(self.basic, true);
  assert.equal(self.identity, false);
  assert.equal(self.role, false);
  assert.equal(self.active, false);
});
