/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert/strict';
import { EDITABLE_PROFILE_FIELDS, getProfileMutationPermissions, type UserRoleName } from './userProfileAuthorization';

const permissions = (actorRole: UserRoleName, targetRole: UserRoleName, self = false) =>
  getProfileMutationPermissions({ id: 'actor', role: actorRole }, { id: self ? 'actor' : 'target', role: targetRole });

test('every role can edit its own basic fields, but only admins can edit another user basics', () => {
  assert.equal(permissions('STUDENT', 'STUDENT', true).basic, true);
  assert.equal(permissions('STUDENT', 'MENTOR').basic, false);
  assert.equal(permissions('SUPERVISOR', 'SUPERVISOR', true).basic, true);
  assert.equal(permissions('STAFF', 'STUDENT').basic, false);
  assert.equal(permissions('ADMIN', 'STUDENT').basic, true);
  assert.equal(permissions('STUDENT', 'STUDENT', true).identity, false);
});

test('staff can manage only student, mentor, and supervisor accounts', () => {
  for (const role of ['STUDENT', 'MENTOR', 'SUPERVISOR'] as const) {
    const result = permissions('STAFF', role);
    assert.equal(result.basic, false);
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
  assert.equal((EDITABLE_PROFILE_FIELDS as readonly string[]).includes('isUserAgreementComplete'), false);
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

test('protected legal names follow the role hierarchy and are never self-editable', () => {
  for (const actor of ['ADMIN', 'STAFF', 'SUPERVISOR', 'MENTOR', 'STUDENT'] as const) {
    assert.equal(permissions(actor, actor, true).identity, false);
  }
  for (const target of ['ADMIN', 'STAFF', 'SUPERVISOR', 'MENTOR', 'STUDENT'] as const) {
    assert.equal(permissions('ADMIN', target).identity, true);
  }
  for (const actor of ['STAFF', 'SUPERVISOR'] as const) {
    assert.equal(permissions(actor, 'MENTOR').identity, true);
    assert.equal(permissions(actor, 'STUDENT').identity, true);
    assert.equal(permissions(actor, 'SUPERVISOR').identity, false);
    assert.equal(permissions(actor, 'STAFF').identity, false);
    assert.equal(permissions(actor, 'ADMIN').identity, false);
  }
  assert.equal(permissions('MENTOR', 'STUDENT').identity, false);
  assert.equal(permissions('STUDENT', 'MENTOR').identity, false);
});
