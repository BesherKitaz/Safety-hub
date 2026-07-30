import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeAcademicAffiliations } from './academicAffiliations';

test('requires at least one complete academic affiliation', () => {
  assert.throws(() => normalizeAcademicAffiliations([]), /Select at least one/);
  assert.throws(
    () => normalizeAcademicAffiliations([{ collegeId: 'college-1', departmentId: '' }]),
    /must include a college and department/,
  );
});

test('normalizes valid multiple affiliations', () => {
  assert.deepEqual(
    normalizeAcademicAffiliations([
      { collegeId: ' college-1 ', departmentId: 'department-1' },
      { collegeId: 'college-2', departmentId: 'department-2' },
    ]),
    [
      { collegeId: 'college-1', departmentId: 'department-1' },
      { collegeId: 'college-2', departmentId: 'department-2' },
    ],
  );
});

test('rejects a department selected more than once', () => {
  assert.throws(
    () => normalizeAcademicAffiliations([
      { collegeId: 'college-1', departmentId: 'department-1' },
      { collegeId: 'college-1', departmentId: 'department-1' },
    ]),
    /same department cannot be selected more than once/,
  );
});
