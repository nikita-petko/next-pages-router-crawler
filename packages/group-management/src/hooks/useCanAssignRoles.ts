import { useEffect, useMemo, useState } from 'react';
import useCurrentGroup from './useCurrentGroup';

const useCanAssignRoles = (): {
  canAssignRoles: boolean;
  isUnrestricted: boolean;
} => {
  const [canAssignRoles, setCanAssignRoles] = useState<boolean>(false);
  const [isUnrestricted, setIsUnrestricted] = useState<boolean>(false);

  const { permissions } = useCurrentGroup();

  useEffect(() => {
    const hasAssignableRoles = (permissions?.assignableRoleIds?.length ?? 0) > 0;
    const isOwner = permissions?.isOwner === true;

    setCanAssignRoles(hasAssignableRoles || isOwner);
    setIsUnrestricted(isOwner);
  }, [permissions?.assignableRoleIds, permissions?.isOwner]);

  return useMemo(() => ({ canAssignRoles, isUnrestricted }), [canAssignRoles, isUnrestricted]);
};

export default useCanAssignRoles;
