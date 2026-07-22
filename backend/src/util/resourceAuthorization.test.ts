/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert/strict';
import { UserRole } from '@prisma/client';

import {
  LAB_MANAGER_ROLES,
  RESOURCE_MANAGER_ROLES,
  RESOURCE_READER_ROLES,
  authorizeCertificationIssuance,
  authorizeRoles,
  authorizeStudentSelf,
  canIssueCertification,
  canReadCertification,
  canManageCertifications,
} from '../middleware/resourceAuthorization';
import { AppError } from '../middleware/errorHandler';

const operationalRoles = [UserRole.ADMIN, UserRole.STAFF, UserRole.SUPERVISOR, UserRole.MENTOR];

test('all operational roles can read managed resources', () => {
  for (const role of operationalRoles) assert.equal(RESOURCE_READER_ROLES.includes(role), true);
  assert.equal(RESOURCE_READER_ROLES.includes(UserRole.STUDENT), false);
});

test('only admins manage labs', () => {
  assert.deepEqual(LAB_MANAGER_ROLES, [UserRole.ADMIN]);
});

test('admins and staff manage tools, training nodes, relationships, and certification records', () => {
  assert.deepEqual(RESOURCE_MANAGER_ROLES, [UserRole.ADMIN, UserRole.STAFF]);
  for (const role of operationalRoles) {
    assert.equal(canManageCertifications(role), role === UserRole.ADMIN || role === UserRole.STAFF);
  }
});

test('admin, staff, and supervisor can issue all three certification levels', () => {
  for (const role of [UserRole.ADMIN, UserRole.STAFF, UserRole.SUPERVISOR]) {
    for (const level of [1, 2, 3]) assert.equal(canIssueCertification(role, level), true);
  }
});

test('mentors can issue Basic and Trust certifications but not Authorized certifications', () => {
  assert.equal(canIssueCertification(UserRole.MENTOR, 1), true);
  assert.equal(canIssueCertification(UserRole.MENTOR, 2), true);
  assert.equal(canIssueCertification(UserRole.MENTOR, 3), false);
});

test('students cannot issue certifications', () => {
  for (const level of [1, 2, 3]) assert.equal(canIssueCertification(UserRole.STUDENT, level), false);
});

test('students can read only certifications issued to themselves', () => {
  assert.equal(canReadCertification(UserRole.STUDENT, 'student', 'student'), true);
  assert.equal(canReadCertification(UserRole.STUDENT, 'student', 'other'), false);
  assert.equal(canReadCertification(UserRole.MENTOR, 'mentor', 'student'), true);
});

test('role middleware returns a 403 error for an authenticated but unauthorized role', () => {
  let result: unknown;
  authorizeRoles(UserRole.ADMIN)(
    { user: { userId: 'staff', email: 'staff@example.com', role: UserRole.STAFF } } as never,
    {} as never,
    (error?: unknown) => { result = error ?? 'allowed'; },
  );
  assert.ok(result instanceof AppError);
  assert.equal(result.statusCode, 403);
});

test('mentor Level 3 issuance returns the clear required 403 error', () => {
  let result: unknown;
  authorizeCertificationIssuance(
    { user: { userId: 'mentor', email: 'mentor@example.com', role: UserRole.MENTOR }, body: { level: 3 } } as never,
    {} as never,
    (error?: unknown) => { result = error ?? 'allowed'; },
  );
  assert.ok(result instanceof AppError);
  assert.equal(result.statusCode, 403);
  assert.equal(result.message, 'Mentors can only issue Basic and Trust certifications.');
});

test('students may access only their own user detail route', () => {
  let ownResult: unknown;
  let otherResult: unknown;
  const middleware = authorizeStudentSelf('id');
  middleware(
    { user: { userId: 'student', email: 'student@example.com', role: UserRole.STUDENT }, params: { id: 'student' } } as never,
    {} as never,
    (error?: unknown) => { ownResult = error ?? 'allowed'; },
  );
  middleware(
    { user: { userId: 'student', email: 'student@example.com', role: UserRole.STUDENT }, params: { id: 'other' } } as never,
    {} as never,
    (error?: unknown) => { otherResult = error ?? 'allowed'; },
  );
  assert.equal(ownResult, 'allowed');
  assert.ok(otherResult instanceof AppError);
  assert.equal(otherResult.statusCode, 403);
});
