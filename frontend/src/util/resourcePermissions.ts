export type UserRole = 'ADMIN' | 'STAFF' | 'SUPERVISOR' | 'MENTOR' | 'STUDENT';

const READ_ROLES: UserRole[] = ['ADMIN', 'STAFF', 'SUPERVISOR', 'MENTOR'];
const MANAGER_ROLES: UserRole[] = ['ADMIN', 'STAFF'];

export const getResourcePermissions = (role: string | null) => {
  const typedRole = role as UserRole | null;
  const canViewResources = typedRole !== null && READ_ROLES.includes(typedRole);
  const canManageResources = typedRole !== null && MANAGER_ROLES.includes(typedRole);

  return {
    canViewLabs: canViewResources,
    canCreateLab: typedRole === 'ADMIN',
    canEditLab: typedRole === 'ADMIN',
    canManageTools: canManageResources,
    canManageTrainingNodes: canManageResources,
    canIssueCertification: canViewResources,
    canIssueLevel3: canViewResources && typedRole !== 'MENTOR',
    canEditCertification: canManageResources,
    canRevokeCertification: canManageResources,
  };
};

export const currentResourcePermissions = () => getResourcePermissions(localStorage.getItem('userRole'));
