import type { FC } from 'react';
import { useMemo } from 'react';
import { useFlag } from '@rbx/flags';
import { withTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import { isExperienceAlertsEnabled } from '@generated/flags/creatorAnalytics';
import { isBandwidthNetworkTabEnabled as isBandwidthNetworkTabEnabledFlag } from '@generated/flags/engineNetworking';
import AnalyticsAlertClientProvider from '@modules/experience-alerts/components/AnalyticsAlertClientProvider';
import { analyticsAlertControlPlaneClient } from '@modules/experience-alerts/constants/types';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import CCUSummary from '../../components/CCUSummary';
import SetupAlertBanner from '../../components/SetupAlertBanner';
import useGetExtendedServicesComputeInsightConfigs from './insights/useGetExtendedServicesComputeInsightConfigs';
import getPerformancePageConfig from './performancePageConfig';

const PerformancePageContent: FC = () => {
  // Network (bandwidth) tab is gated to the DeveloperAnalyticsAdmin and
  // DeveloperAnalyticsLimited roles while in development.
  const { ready: isNetworkTabReady, value: isNetworkTabEnabledValue } = useFlag(
    isBandwidthNetworkTabEnabledFlag,
  );
  const isNetworkTabEnabled = isNetworkTabReady && isNetworkTabEnabledValue;

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
      !!isExperienceAlertsEnabledFlag,
      isNetworkTabEnabled,
      extendedServicesComputeInsightConfigs,
    );
  }, [isExperienceAlertsEnabledFlag, isNetworkTabEnabled, extendedServicesComputeInsightConfigs]);

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
          <AnalyticsAlertClientProvider client={analyticsAlertControlPlaneClient}>
            <SetupAlertBanner isExperienceAlertsEnabled={isExperienceAlertsEnabledFlag} />
          </AnalyticsAlertClientProvider>
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
