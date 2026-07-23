import {
  developerAnalyticsAggregationsClient,
  DeveloperAnalyticsAggregationsClientWrapper,
} from '@modules/clients/analytics';
import { FeatureFlagNamespace } from '../namespaces';
import { type TFlag, type FeatureFlagsClient, type EvaluationContext } from '../types';
import AnalyticsFlags from './flags';

/**
 * Permission flags that are handled specially - they originate from Obelix configs
 * and are returned by the feature permission endpoint when universeId is present.
 */
const AnalyticsPermissionFlags = [
  'experienceHasPerformanceMonitoringAccess',
  'userCanViewAnalyticsForUniverse',
  'experienceHasExperimentationMinDau',
  'experienceHasNoInGameExperiment',
] as const;
type AnalyticsPermissionFlag = (typeof AnalyticsPermissionFlags)[number];

const isAnalyticsPermissionFlag = (flag: string): flag is AnalyticsPermissionFlag => {
  return AnalyticsPermissionFlags.includes(flag as AnalyticsPermissionFlag);
};

class AnalyticsFlagsClient implements FeatureFlagsClient<FeatureFlagNamespace.Analytics> {
  constructor(private readonly client: DeveloperAnalyticsAggregationsClientWrapper) {
    this.client = client;
  }

  // eslint-disable-next-line class-methods-use-this -- no use
  private isFlagValid(flag: string): flag is TFlag<FeatureFlagNamespace.Analytics> {
    return AnalyticsFlags.includes(flag as TFlag<FeatureFlagNamespace.Analytics>);
  }

  fetchFlags({
    universeId,
  }: EvaluationContext & { userId: number }): Promise<
    Partial<Record<TFlag<FeatureFlagNamespace.Analytics>, boolean>>
  > {
    // When universeId is present, permission flags are returned by the feature permission endpoint.
    // These permission flags originate from Obelix configs, so we exclude them here.
    const filteredFlags = AnalyticsFlags.filter(
      (flag) => !isAnalyticsPermissionFlag(flag) && flag !== 'flagForUnitTest',
    );

    const response = universeId
      ? this.client
          .getfeaturePermissionsGetFeaturePermission({
            flags: filteredFlags,
            universeId,
          })
          .then(({ flags, ...permissionFields }) => {
            return {
              flags: {
                ...flags,
                ...permissionFields,
              },
            };
          })
      : this.client.getfeaturePermissionsGetFeatureFlags({
          flags: filteredFlags,
        });

    return response.then(({ flags }) => {
      const result: Partial<Record<TFlag<FeatureFlagNamespace.Analytics>, boolean>> = {};
      Object.entries(flags).forEach(([flag, value]) => {
        if (this.isFlagValid(flag)) {
          result[flag] = value;
        }
      });
      return result;
    });
  }
}

const analyticsFlagsClient = new AnalyticsFlagsClient(developerAnalyticsAggregationsClient);

export default analyticsFlagsClient;
