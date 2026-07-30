import { AppError } from '../middleware/errorHandler';

export type AcademicAffiliationInput = {
  collegeId?: unknown;
  departmentId?: unknown;
};

export const normalizeAcademicAffiliations = (value: unknown) => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new AppError(
      400,
      'ACADEMIC_AFFILIATION_REQUIRED',
      'Select at least one college and department.',
    );
  }

  const normalized = value.map((entry: AcademicAffiliationInput) => ({
    collegeId: typeof entry?.collegeId === 'string' ? entry.collegeId.trim() : '',
    departmentId: typeof entry?.departmentId === 'string' ? entry.departmentId.trim() : '',
  }));

  if (normalized.some((entry) => !entry.collegeId || !entry.departmentId)) {
    throw new AppError(
      400,
      'INVALID_ACADEMIC_AFFILIATION',
      'Every academic affiliation must include a college and department.',
    );
  }

  if (new Set(normalized.map((entry) => entry.departmentId)).size !== normalized.length) {
    throw new AppError(
      400,
      'DUPLICATE_ACADEMIC_AFFILIATION',
      'The same department cannot be selected more than once.',
    );
  }

  return normalized;
};
