import type { FC } from 'react';
import { useMemo } from 'react';
import { useFlag } from '@rbx/flags';
import { withTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import { isBandwidthNetworkTabEnabled as isBandwidthNetworkTabEnabledFlag } from '@generated/flags/engineNetworking';
import AnalyticsAlertClientProvider from '@modules/experience-alerts/components/AnalyticsAlertClientProvider';
import { analyticsAlertControlPlaneClient } from '@modules/experience-alerts/constants/types';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
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

  const extendedServicesComputeInsightConfigs = useGetExtendedServicesComputeInsightConfigs();

  const performancePageConfig = useMemo(() => {
    return getPerformancePageConfig(isNetworkTabEnabled, extendedServicesComputeInsightConfigs);
  }, [isNetworkTabEnabled, extendedServicesComputeInsightConfigs]);

  return (
    <CreatorAnalyticsLayout
      config={performancePageConfig}
      preControlComponentHack={
        <Grid container>
          <AnalyticsAlertClientProvider client={analyticsAlertControlPlaneClient}>
            <SetupAlertBanner />
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
