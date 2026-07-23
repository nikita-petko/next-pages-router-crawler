import type { FC } from 'react';
import { useMemo } from 'react';
import { useFlag } from '@rbx/flags';
import { withTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import {
  isClientScriptCpuTimeEnabled as isClientScriptCPUTimeEnabledFlag,
  isCpuCoreUtilizationEnabled as isCpuCoreUtilizationFlag,
  isExperienceAlertsEnabled,
} from '@generated/flags/creatorAnalytics';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import CCUSummary from '../../components/CCUSummary';
import useGetExtendedServicesComputeInsightConfigs from './insights/useGetExtendedServicesComputeInsightConfigs';
import getPerformancePageConfig from './performancePageConfig';

const PerformancePageContent: FC = () => {
  const { ready: isClientScriptCPUTimeReady, value: isClientScriptCPUTimeEnabledValue } = useFlag(
    isClientScriptCPUTimeEnabledFlag,
  );
  const isClientScriptCPUTimeEnabled =
    isClientScriptCPUTimeReady && isClientScriptCPUTimeEnabledValue;
  const { ready: isCpuCoreUtilizationReady, value: isCpuCoreUtilizationEnabledValue } =
    useFlag(isCpuCoreUtilizationFlag);
  const isCpuCoreUtilizationEnabled = isCpuCoreUtilizationReady && isCpuCoreUtilizationEnabledValue;

  const { id } = useUniverseResource();
  const { value: isExperienceAlertsEnabledFlag, ready: isExperienceAlertsFlagReady } = useFlag(
    isExperienceAlertsEnabled,
    {
      universeId: id,
    },
  );

  const extendedServicesComputeInsightConfigs = useGetExtendedServicesComputeInsightConfigs();

  const performancePageConfig = useMemo(() => {
    return getPerformancePageConfig(
      isClientScriptCPUTimeEnabled,
      isCpuCoreUtilizationEnabled,
      !!isExperienceAlertsEnabledFlag,
      extendedServicesComputeInsightConfigs,
    );
  }, [
    isClientScriptCPUTimeEnabled,
    isCpuCoreUtilizationEnabled,
    isExperienceAlertsEnabledFlag,
    extendedServicesComputeInsightConfigs,
  ]);

  // Defer mount until the experience-alerts flag has resolved: the layout's
  // annotation provider snapshots `defaultAnnotationTypes` to the URL on first
  // render, and a stale `false` would silently drop ConfiguredAlertIncident.
  if (!isExperienceAlertsFlagReady) {
    return null;
  }

  return (
    <CreatorAnalyticsLayout
      config={performancePageConfig}
      preControlComponentHack={
        <Grid container>
          <CCUSummary />
        </Grid>
      }
    />
  );
};

export default withTranslation(PerformancePageContent, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.Insights,
  TranslationNamespace.Navigation,
]);
