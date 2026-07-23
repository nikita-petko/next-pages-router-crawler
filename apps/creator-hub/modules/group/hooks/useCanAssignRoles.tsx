import { useEffect, useMemo, useState } from 'react';
import useCurrentOrganization from './useCurrentOrganization';

const useCanAssignRoles = (): {
  canAssignRoles: boolean;
  isUnrestricted: boolean;
} => {
  const [canAssignRoles, setCanAssignRoles] = useState<boolean>(false);
  const [isUnrestricted, setIsUnrestricted] = useState<boolean>(false);

  const { permissions } = useCurrentOrganization();

  useEffect(() => {
    const hasAssignableRoles =
      permissions?.assignableRoleIds && permissions.assignableRoleIds.length > 0;

    setCanAssignRoles(hasAssignableRoles || permissions?.isOwner === true);
    setIsUnrestricted(permissions?.isOwner === true);
  }, [permissions?.assignableRoleIds, permissions?.isOwner]);

  return useMemo(() => ({ canAssignRoles, isUnrestricted }), [canAssignRoles, isUnrestricted]);
};
export default useCanAssignRoles;
