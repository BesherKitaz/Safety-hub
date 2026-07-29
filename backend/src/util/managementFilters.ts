const certificationStatuses = ['ACTIVE', 'REVOKED', 'EXPIRED', 'DEACTIVATED'] as const;
type CertificationStatusFilter = typeof certificationStatuses[number];

export const normalizeCertificationStatusFilter = (
  value: unknown,
): CertificationStatusFilter | undefined =>
  typeof value === 'string' && certificationStatuses.includes(value as CertificationStatusFilter)
    ? value as CertificationStatusFilter
    : undefined;

export const normalizeCertificationLevelFilter = (value: unknown) => {
  const level = Number(value);
  return Number.isInteger(level) && level >= 1 && level <= 3 ? level : undefined;
};

export const parseOptionalBooleanFilter = (value: unknown) =>
  value === 'true' ? true : value === 'false' ? false : undefined;
