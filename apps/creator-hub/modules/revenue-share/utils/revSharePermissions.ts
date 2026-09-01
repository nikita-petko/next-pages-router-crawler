import type { OrganizationPermissions } from '@modules/clients/organizationApi';

export type RevShareAccess = {
  canView: boolean;
  canManage: boolean;
};

export const FULL_REV_SHARE_ACCESS: RevShareAccess = {
  canView: true,
  canManage: true,
};

export const resolveRevShareAccess = (
  permissions: OrganizationPermissions | null | undefined,
): RevShareAccess => {
  const canManage =
    permissions?.isOwner === true || permissions?.canConfigureRevenueDetails === true;
  const canView = canManage || permissions?.canViewRevenueDetails === true;
  return { canView, canManage };
};
