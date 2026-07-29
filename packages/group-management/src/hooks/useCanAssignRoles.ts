import { useMemo } from 'react';
import { canAssignRole } from '../utils/groupPermissions';
import useCurrentGroup from './useCurrentGroup';

const useCanAssignRoles = (): {
  canAssignRoles: boolean;
  isUnrestricted: boolean;
} => {
  const { isOwner, rolePermissions } = useCurrentGroup();

  const canAssignRoles = useMemo(
    () => isOwner === true || Object.values(rolePermissions ?? {}).some(canAssignRole),
    [isOwner, rolePermissions],
  );

  return useMemo(
    () => ({ canAssignRoles, isUnrestricted: isOwner === true }),
    [canAssignRoles, isOwner],
  );
};

export default useCanAssignRoles;
