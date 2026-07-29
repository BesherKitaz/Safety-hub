export const canReceiveCertification = (
  issuerId: string,
  recipientId: string,
  agreementComplete: boolean,
) => issuerId !== recipientId && agreementComplete;

export const canChangeRole = (
  currentRole: string,
  requestedRole: string,
  agreementComplete: boolean,
) => currentRole === requestedRole || agreementComplete;
