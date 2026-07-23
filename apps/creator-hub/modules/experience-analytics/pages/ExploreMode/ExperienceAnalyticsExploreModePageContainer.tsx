import type { FC } from 'react';
import { lazy, Suspense, useMemo } from 'react';
import { useFlag } from '@rbx/flags';
import {
  isClientScriptCpuTimeEnabled as isClientScriptCPUTimeEnabledFlag,
  isRotraceMetricEnabled as isRotraceMetricEnabledFlag,
} from '@generated/flags/creatorAnalytics';
import { isHomeAcquisitionSignalsEnabled as isHomeAcquisitionSignalsEnabledFlag } from '@generated/flags/gameDiscoveryServing';
import gameUpdateNotificationsClient from '@modules/clients/gameUpdateNotifications';
import getEnabledChartConfiguratorMetrics from '@modules/experience-analytics-shared/chartConfigurator/getEnabledChartConfiguratorMetrics';
import { customEventsMetric } from '@modules/experience-analytics-shared/components/chartConfigurator/useChartConfiguratorSourceSelection';
import RecommendedEventsLiveStatsClientProvider from '@modules/experience-analytics-shared/context/RecommendedEventsLiveStatsClientProvider';
import ExperienceAnalyticsExploreModeContextProvider from '@modules/experience-analytics-shared/exploreMode/ExperienceAnalyticsExploreModeContextProvider';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import {
  TextFilterProvider,
  type TextFilterFn,
} from '@modules/experience-analytics-shared/text-filter/TextFilterContext';

const ExploreModeSidebarPage = lazy(() => import('./sidebar/ExploreModeSidebarPage'));

// Defined at module scope so the reference is stable across renders — the
// downstream `useTextFilterValidation` hook treats identity churn as a
// debounce reset, which we don't want for the production wiring.
const filterTextThroughGameUpdateNotifications: TextFilterFn = async (text) => {
  const response = await gameUpdateNotificationsClient.filterGameUpdateText({ body: text });
  // The generated client types `isFiltered` as optional; treat a missing
  // flag as not-filtered (fail open) so a malformed response can't strand
  // the user. Real moderation hits always populate the field.
  return { isFiltered: response.isFiltered === true };
};

const ExperienceAnalyticsExploreModePageWithFlags: FC<{ universeId: number }> = ({
  universeId,
}) => {
  const { ready: isClientScriptCPUTimeReady, value: isClientScriptCPUTimeEnabledValue } = useFlag(
    isClientScriptCPUTimeEnabledFlag,
  );
  const { ready: isRotraceMetricReady, value: isRotraceMetricEnabledValue } = useFlag(
    isRotraceMetricEnabledFlag,
    {
      universeId,
    },
  );
  const { ready: isHomeAcquisitionSignalsReady, value: isHomeAcquisitionSignalsEnabledValue } =
    useFlag(isHomeAcquisitionSignalsEnabledFlag, { universeId });
  const isClientScriptCPUTimeEnabled =
    isClientScriptCPUTimeReady && isClientScriptCPUTimeEnabledValue;
  const isRotraceMetricEnabled = isRotraceMetricReady && isRotraceMetricEnabledValue;
  const isHomeAcquisitionSignalsEnabled =
    isHomeAcquisitionSignalsReady && isHomeAcquisitionSignalsEnabledValue;
  const featureFlagsFetched =
    isClientScriptCPUTimeReady && isRotraceMetricReady && isHomeAcquisitionSignalsReady;
  const allowedMetrics = useMemo(() => {
    const metrics = getEnabledChartConfiguratorMetrics({
      isClientScriptCPUTimeEnabled,
      isRotraceMetricEnabled,
      isHomeAcquisitionSignalsEnabled,
    });
    if (!metrics.includes(customEventsMetric)) {
      return [...metrics, customEventsMetric];
    }
    return metrics;
  }, [isClientScriptCPUTimeEnabled, isRotraceMetricEnabled, isHomeAcquisitionSignalsEnabled]);

  // Do not initialize URL-backed configurator state against the default flag
  // values. Otherwise a gated metric can be treated as unavailable during the
  // first render and replaced by the user's last selected metric before its
  // flag resolves.
  if (!featureFlagsFetched) {
    return null;
  }

  return (
    <TextFilterProvider filterText={filterTextThroughGameUpdateNotifications}>
      <RecommendedEventsLiveStatsClientProvider>
        <ExperienceAnalyticsExploreModeContextProvider
          allowedMetrics={allowedMetrics}
          featureFlagsFetched={featureFlagsFetched}>
          <Suspense fallback={null}>
            <ExploreModeSidebarPage />
          </Suspense>
        </ExperienceAnalyticsExploreModeContextProvider>
      </RecommendedEventsLiveStatsClientProvider>
    </TextFilterProvider>
  );
};

const ExperienceAnalyticsExploreModePageContainer: FC = () => {
  const { id: universeId, isLoading: isUniverseLoading } = useUniverseResource();

  // Contextual flags must not be evaluated with the placeholder universe ID.
  // Mounting the flag-consuming component only after the resource resolves also
  // ensures URL-backed configurator state is initialized exactly once against
  // the final universe-scoped allowlist.
  if (isUniverseLoading) {
    return null;
  }

  return <ExperienceAnalyticsExploreModePageWithFlags universeId={universeId} />;
};

export default ExperienceAnalyticsExploreModePageContainer;
