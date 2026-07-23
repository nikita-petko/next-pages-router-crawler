import {
  ExperienceAnalyticsExploreModeContextProvider,
  getEnabledExploreModeMetrics,
} from '@modules/experience-analytics-shared';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FC, lazy, Suspense, useMemo } from 'react';
import ExperienceAnalyticsExploreModePage from './ExperienceAnalyticsExploreModePage';
import { customEventsMetric } from './sidebar/useExploreModeSourceSelection';

const ExploreModeSidebarPage = lazy(() => import('./sidebar/ExploreModeSidebarPage'));

const ExperienceAnalyticsExploreModePageContainer: FC = () => {
  const {
    isExploreModeSidebarLayoutEnabled,
    isClientScriptCPUTimeEnabled,
    isRotraceMetricEnabled,
    isDeepPlayEnabled,
    isNewRFYSignalsEnabled,
    isExploreModeComputedMetricsEnabled,
    isExploreModeL7SmoothingEnabled,
    isFetched,
  } = useFeatureFlagsForNamespace(
    [
      'isClientScriptCPUTimeEnabled',
      'isRotraceMetricEnabled',
      'isExploreModeSidebarLayoutEnabled',
      'isDeepPlayEnabled',
      'isNewRFYSignalsEnabled',
      'isExploreModeComputedMetricsEnabled',
      'isExploreModeL7SmoothingEnabled',
    ],
    FeatureFlagNamespace.Analytics,
  );
  const enableL7Smoothing = isFetched && isExploreModeL7SmoothingEnabled;
  const allowedMetrics = useMemo(() => {
    const metrics = getEnabledExploreModeMetrics({
      isClientScriptCPUTimeEnabled,
      isRotraceMetricEnabled,
      isDeepPlayEnabled,
      isNewRFYSignalsEnabled,
      isExploreModeL7SmoothingEnabled: enableL7Smoothing,
    });
    if (!metrics.includes(customEventsMetric)) {
      return [...metrics, customEventsMetric];
    }
    return metrics;
  }, [
    isClientScriptCPUTimeEnabled,
    isRotraceMetricEnabled,
    isDeepPlayEnabled,
    isNewRFYSignalsEnabled,
    enableL7Smoothing,
  ]);
  const enableComputedMetrics = isFetched && isExploreModeComputedMetricsEnabled;

  return (
    <ExperienceAnalyticsExploreModeContextProvider
      allowedMetrics={allowedMetrics}
      enableComputedMetrics={enableComputedMetrics}
      enableL7Smoothing={enableL7Smoothing}
      featureFlagsFetched={isFetched}>
      {isExploreModeSidebarLayoutEnabled ? (
        <Suspense fallback={null}>
          <ExploreModeSidebarPage />
        </Suspense>
      ) : (
        <ExperienceAnalyticsExploreModePage />
      )}
    </ExperienceAnalyticsExploreModeContextProvider>
  );
};
export default ExperienceAnalyticsExploreModePageContainer;
