const DAY_MS = 24 * 60 * 60 * 1000;

export const calculateCertificationExpiryDate = (
  issuedAt: Date,
  durationDays: number,
) => new Date(issuedAt.getTime() + durationDays * DAY_MS);

export const isCertificationDue = (
  expiryDate: Date | null,
  now: Date,
) => expiryDate !== null && expiryDate.getTime() <= now.getTime();

export const dueDateExpirationReason = (expiryDate: Date) =>
  `The certification expiry date (${expiryDate.toISOString()}) passed.`;

export const dependencyExpirationReason =
  'A prerequisite certification expired, so this dependent certification was expired automatically.';
