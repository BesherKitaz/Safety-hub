export const USER_ROLES = ['ADMIN', 'STAFF', 'SUPERVISOR', 'MENTOR', 'STUDENT'] as const;
export type UserRoleName = typeof USER_ROLES[number];

export const BASIC_PROFILE_FIELDS = ['graduationYear', 'jobTitle', 'department', 'phoneNumber', 'address'] as const;
export const PROTECTED_IDENTITY_FIELDS = ['firstName', 'lastName', 'email'] as const;
export const ADMINISTRATIVE_FIELDS = ['role', 'isActive', 'isUserAgreementComplete'] as const;
export const EDITABLE_PROFILE_FIELDS = [...BASIC_PROFILE_FIELDS, ...PROTECTED_IDENTITY_FIELDS, ...ADMINISTRATIVE_FIELDS] as const;
export type EditableProfileField = typeof EDITABLE_PROFILE_FIELDS[number];

const staffManageableRoles: UserRoleName[] = ['STUDENT', 'MENTOR', 'SUPERVISOR'];

export type ProfileMutationPermissions = {
  basic: boolean;
  identity: boolean;
  role: boolean;
  active: boolean;
  agreement: boolean;
  assignableRoles: UserRoleName[];
};

export const getProfileMutationPermissions = (
  actor: { id: string; role: UserRoleName },
  target: { id: string; role: UserRoleName },
): ProfileMutationPermissions => {
  const self = actor.id === target.id;
  const actorIsAdmin = actor.role === 'ADMIN';
  const actorIsStaff = actor.role === 'STAFF';
  const staffCanManageTarget = actorIsStaff && !self && staffManageableRoles.includes(target.role);

  let agreement = self;
  if (actorIsAdmin) agreement = true;
  else if (actorIsStaff) agreement = self || staffCanManageTarget;
  else if (!self && actor.role === 'MENTOR') agreement = ['MENTOR', 'STUDENT'].includes(target.role);
  else if (!self && actor.role === 'SUPERVISOR') agreement = ['SUPERVISOR', 'MENTOR', 'STUDENT'].includes(target.role);

  return {
    basic: self || (actorIsAdmin && !self) || staffCanManageTarget,
    identity: actorIsAdmin && !self,
    role: !self && (actorIsAdmin || staffCanManageTarget),
    active: !self && (actorIsAdmin || staffCanManageTarget),
    agreement,
    assignableRoles: !self && actorIsAdmin ? [...USER_ROLES] : staffCanManageTarget ? [...staffManageableRoles] : [],
  };
};

export const canMutateProfileField = (permissions: ProfileMutationPermissions, field: EditableProfileField) => {
  if ((BASIC_PROFILE_FIELDS as readonly string[]).includes(field)) return permissions.basic;
  if ((PROTECTED_IDENTITY_FIELDS as readonly string[]).includes(field)) return permissions.identity;
  if (field === 'role') return permissions.role;
  if (field === 'isActive') return permissions.active;
  return permissions.agreement;
};
