import { useAuthentication } from '@modules/authentication/providers';
import { groupsClient } from '@modules/clients';
import { developerAnalyticsAggregationsClient } from '@modules/clients/analytics';
import { useQuery } from '@tanstack/react-query';

const officialGroupOfRobloxId = 1200769;

/**
 * Hook to determine if the current user has employee-level access for feature flag overrides.
 *
 * Combines two checks:
 * 1. Group membership in the Official Roblox group (fast, but not always reliable)
 * 2. The `flagRuntimeOverrideControlEnabled` flag from the backend (reliable fallback)
 *
 * Returns `true` if either check passes.
 */
const useIsEmployee = () => {
  const { user } = useAuthentication();

  // Primary check: group membership (fast but may have false negatives)
  const { data: isEmployeeByGroup } = useQuery({
    queryKey: ['CheckIfSignedInUserIsEmployee', user?.id],
    queryFn: () =>
      groupsClient
        .getGroupMembershipMetadata({
          groupId: officialGroupOfRobloxId,
          includeNotificationPreferences: false,
        })
        .then((data) => !!data?.userRole?.role?.rank),
    enabled: !!user?.id,
    staleTime: Infinity,
  });

  // Fallback check: feature flag (only fetched if group check explicitly returned false)
  // Using `=== false` instead of `!isEmployeeByGroup` to avoid fetching when first query is still pending
  const { data: isEmployeeByFlag } = useQuery({
    queryKey: ['flagRuntimeOverrideControlEnabled', user?.id],
    queryFn: () =>
      developerAnalyticsAggregationsClient
        .getfeaturePermissionsGetFeatureFlags({
          flags: ['flagRuntimeOverrideControlEnabled'],
        })
        .then((res) => res.flags?.flagRuntimeOverrideControlEnabled ?? false),
    enabled: !!user?.id && isEmployeeByGroup === false,
    staleTime: Infinity,
  });

  return isEmployeeByGroup || isEmployeeByFlag;
};

export default useIsEmployee;
