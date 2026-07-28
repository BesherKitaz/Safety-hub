import { AppError } from '../middleware/errorHandler';

export type SafetyHubAgreementCompletion = {
  signatureName: string;
  signedDate: Date;
  acknowledgedLinkIds: string[];
};

export const validateSafetyHubAgreementCompletion = (input: unknown): SafetyHubAgreementCompletion => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new AppError(400, 'INVALID_AGREEMENT_COMPLETION', 'Agreement completion must be an object');
  }

  const { signatureName, signedDate, acknowledgedLinkIds } = input as Record<string, unknown>;
  if (typeof signatureName !== 'string' || !signatureName.trim()) {
    throw new AppError(400, 'AGREEMENT_SIGNATURE_REQUIRED', 'A non-empty signature name is required');
  }
  if (typeof signedDate !== 'string' || !signedDate.trim()) {
    throw new AppError(400, 'AGREEMENT_SIGNED_DATE_REQUIRED', 'A signed date is required');
  }

  const completionDate = new Date(signedDate);
  if (Number.isNaN(completionDate.getTime())) {
    throw new AppError(400, 'INVALID_AGREEMENT_SIGNED_DATE', 'The signed date must be a valid date');
  }
  if (!Array.isArray(acknowledgedLinkIds) || acknowledgedLinkIds.some((id) => typeof id !== 'string' || !id.trim())) {
    throw new AppError(400, 'INVALID_AGREEMENT_ACKNOWLEDGEMENTS', 'Agreement acknowledgements must be a list of link IDs');
  }

  return {
    signatureName: signatureName.trim(),
    signedDate: completionDate,
    acknowledgedLinkIds: [...new Set(acknowledgedLinkIds.map((id) => id.trim()))],
  };
};
