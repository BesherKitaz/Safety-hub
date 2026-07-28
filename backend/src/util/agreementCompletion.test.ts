import assert from 'node:assert/strict';
import test from 'node:test';
import { AppError } from '../middleware/errorHandler';
import { validateSafetyHubAgreementCompletion } from './agreementCompletion';

test('normalizes a valid Safety Hub agreement completion', () => {
  const result = validateSafetyHubAgreementCompletion({
    signatureName: '  Ada Lovelace  ',
    signedDate: '2026-07-28',
    acknowledgedLinkIds: ['link-1', 'link-1', 'link-2'],
  });

  assert.equal(result.signatureName, 'Ada Lovelace');
  assert.equal(result.signedDate.toISOString(), '2026-07-28T00:00:00.000Z');
  assert.deepEqual(result.acknowledgedLinkIds, ['link-1', 'link-2']);
});

for (const input of [
  { signedDate: '2026-07-28', acknowledgedLinkIds: [] },
  { signatureName: '   ', signedDate: '2026-07-28', acknowledgedLinkIds: [] },
]) {
  test('rejects a missing or empty signature', () => {
    assert.throws(
      () => validateSafetyHubAgreementCompletion(input),
      (error: unknown) => error instanceof AppError && error.code === 'AGREEMENT_SIGNATURE_REQUIRED',
    );
  });
}

for (const input of [
  { signatureName: 'Ada Lovelace', acknowledgedLinkIds: [] },
  { signatureName: 'Ada Lovelace', signedDate: '', acknowledgedLinkIds: [] },
  { signatureName: 'Ada Lovelace', signedDate: 'not-a-date', acknowledgedLinkIds: [] },
]) {
  test('rejects a missing or invalid signed date', () => {
    assert.throws(
      () => validateSafetyHubAgreementCompletion(input),
      (error: unknown) => error instanceof AppError
        && ['AGREEMENT_SIGNED_DATE_REQUIRED', 'INVALID_AGREEMENT_SIGNED_DATE'].includes(error.code),
    );
  });
}

test('rejects missing agreement acknowledgements', () => {
  assert.throws(
    () => validateSafetyHubAgreementCompletion({ signatureName: 'Ada Lovelace', signedDate: '2026-07-28' }),
    (error: unknown) => error instanceof AppError && error.code === 'INVALID_AGREEMENT_ACKNOWLEDGEMENTS',
  );
});
