import { useUniversePermissions } from '@modules/react-query/organizations';

const useCanManageAntiCheat = (universeId: number | undefined) => {
  const permissionsQuery = useUniversePermissions(universeId);

  // Anti-cheat management is gated behind the manage-bans permission, reusing the existing
  // moderation-level right rather than introducing a dedicated anti-cheat permission.
  const canManageAntiCheat = permissionsQuery.data?.manageBans === true;

  return { ...permissionsQuery, canManageAntiCheat };
};

export default useCanManageAntiCheat;
