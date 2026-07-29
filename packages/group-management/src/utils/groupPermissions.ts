import type { ResolvedPermissions } from '../clients/groups';

export const canAssignRole = (permissions: ResolvedPermissions | undefined): boolean =>
  permissions?.canAssign === true;

export const canEditRoleMetadata = (permissions: ResolvedPermissions | undefined): boolean =>
  permissions?.canEditMetadata === true;

export const canEditRolePermissions = (permissions: ResolvedPermissions | undefined): boolean =>
  permissions?.canEditPermissions === true;

export const canUpdateRolePosition = (permissions: ResolvedPermissions | undefined): boolean =>
  permissions?.canUpdatePosition === true;

export const canViewRoleMembersTab = (
  permissions: ResolvedPermissions | undefined,
  isDefaultMemberRole: boolean,
  isGuestRole: boolean,
  isOwner: boolean | undefined = false,
): boolean => !isDefaultMemberRole && !isGuestRole && (isOwner || canAssignRole(permissions));

export const canViewAnyRoleTab = (
  permissions: ResolvedPermissions | undefined,
  isDefaultMemberRole: boolean,
  isGuestRole: boolean,
  isOwner: boolean | undefined = false,
): boolean =>
  isOwner ||
  canEditRolePermissions(permissions) ||
  canViewRoleMembersTab(permissions, isDefaultMemberRole, isGuestRole, isOwner) ||
  canEditRoleMetadata(permissions);
