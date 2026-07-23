import type { PermissionRequest, PermissionResponse } from './types';

// Map permissions returned from develop API to arrakis permissions. This is for display only.
const LEGACY_TO_NEW_PERMISSIONS_MAP: Record<string, string[]> = {
  Play: ['Universe.GranularPlayer'],
  Edit: ['Universe.GranularEditor', 'Universe.GranularPlayer'],
};

export function canPermissionChange(selection: PermissionResponse): boolean {
  return selection.canEdit && !selection.isInherited;
}

export function toPermissionsMap(
  legacyPermission: Record<string, string>[] = [],
): Record<string, PermissionResponse> {
  const permissionsMap: Record<string, PermissionResponse> = {};

  legacyPermission.forEach((permission) => {
    const permissionIds = LEGACY_TO_NEW_PERMISSIONS_MAP[permission.action];
    if (permissionIds) {
      permissionIds.forEach((permissionId) => {
        permissionsMap[permissionId] = {
          canEdit: false,
          isGranted: true,
        };
      });
    }
  });

  return permissionsMap;
}

export function findUpdatedPermissions(
  initialPermissions: Record<string, PermissionResponse>,
  permissionData: Record<string, PermissionRequest>,
): { selected: string[]; unselected: string[] } {
  const selected: string[] = [];
  const unselected: string[] = [];

  Object.entries(permissionData).forEach(([permissionId, permission]) => {
    if (initialPermissions[permissionId].isGranted !== permission.isGranted) {
      if (permission.isGranted) {
        selected.push(permissionId);
      } else {
        unselected.push(permissionId);
      }
    }
  });

  return { selected, unselected };
}
