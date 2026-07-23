import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { FeaturePermissionsResponse } from '@modules/clients/analytics';
import { developerAnalyticsAggregationsClient } from '@modules/clients/analytics';

const ANALYTICS_PERMISSIONS_QUERY_KEY = 'analytics-permissions';
const INVALID_ANALYTICS_EXPERIENCE_PERMISSIONS_QUERY_SCOPE = 'invalid-experience';

export const ANALYTICS_EXPERIENCE_PERMISSIONS = [
  'experienceHasPerformanceMonitoringAccess',
  'userCanViewAnalyticsForUniverse',
  'userCanManageAnalyticsAlertForUniverse',
  'canSaveCustomDashboards',
  'experienceHasExperimentationMinDau',
  'experienceHasNoInGameExperiment',
] as const;

export type AnalyticsExperiencePermission = (typeof ANALYTICS_EXPERIENCE_PERMISSIONS)[number];

export type AnalyticsExperiencePermissions = Record<AnalyticsExperiencePermission, boolean>;

const defaultAnalyticsExperiencePermissions: AnalyticsExperiencePermissions = {
  experienceHasPerformanceMonitoringAccess: false,
  userCanViewAnalyticsForUniverse: false,
  userCanManageAnalyticsAlertForUniverse: false,
  canSaveCustomDashboards: false,
  experienceHasExperimentationMinDau: false,
  experienceHasNoInGameExperiment: false,
};

export type UseAnalyticsExperiencePermissionsResult = AnalyticsExperiencePermissions & {
  isPending: boolean;
  isError: boolean;
};

const getValidUniverseId = (universeId?: number): number | undefined => {
  return universeId !== undefined && universeId > 0 ? universeId : undefined;
};

const selectAnalyticsExperiencePermissions = (
  response: Partial<FeaturePermissionsResponse>,
): AnalyticsExperiencePermissions => {
  return {
    experienceHasPerformanceMonitoringAccess:
      response.experienceHasPerformanceMonitoringAccess === true,
    userCanViewAnalyticsForUniverse: response.userCanViewAnalyticsForUniverse === true,
    userCanManageAnalyticsAlertForUniverse:
      response.userCanManageAnalyticsAlertForUniverse === true,
    canSaveCustomDashboards: response.canSaveCustomDashboards === true,
    experienceHasExperimentationMinDau: response.experienceHasExperimentationMinDau === true,
    experienceHasNoInGameExperiment: response.experienceHasNoInGameExperiment === true,
  };
};

export const useAnalyticsExperiencePermissions = (
  universeId: number,
): UseAnalyticsExperiencePermissionsResult => {
  const validUniverseId = getValidUniverseId(universeId);

  const query = useQuery({
    queryKey: [
      ANALYTICS_PERMISSIONS_QUERY_KEY,
      validUniverseId ?? INVALID_ANALYTICS_EXPERIENCE_PERMISSIONS_QUERY_SCOPE,
    ],
    queryFn: (): Promise<FeaturePermissionsResponse> =>
      developerAnalyticsAggregationsClient.getfeaturePermissionsGetFeaturePermission(
        validUniverseId === undefined ? {} : { universeId: validUniverseId },
      ),
    select: selectAnalyticsExperiencePermissions,
    enabled: validUniverseId !== undefined,
    staleTime: Infinity,
  });

  return useMemo(
    () => ({
      ...(query.data ?? defaultAnalyticsExperiencePermissions),
      isPending: query.isPending,
      isError: query.isError,
    }),
    [query.data, query.isError, query.isPending],
  );
};
