import type { FC } from 'react';
import React from 'react';
import type { OverviewVariant } from '@modules/creations-overview/hooks/useOverviewVariant';
import AnalyticsAlertClientProvider from '@modules/experience-alerts/components/AnalyticsAlertClientProvider';
import { analyticsAlertControlPlaneClient } from '@modules/experience-alerts/constants/types';
import { OnboardingTipsProvider } from '@modules/experience-analytics-shared/context/OnboardingTipsProvider';
import UniverseAnalyticsInsightsClientProvider from '@modules/experience-analytics-shared/context/UniverseAnalyticsInsightsClientProvider';
import { UniversePerformanceRaqiClientProvider } from '@modules/experience-analytics-shared/context/UniversePerformanceRaqiClientProvider';
import ExperienceOverviewPageContent from './ExperienceOverviewPageContent';

type ExperienceOverviewPageProps = {
  variant: OverviewVariant;
  heroElement?: React.ReactElement;
};
const ExperienceOverviewPage: FC<ExperienceOverviewPageProps> = ({ variant, heroElement }) => (
  <UniversePerformanceRaqiClientProvider>
    {/* need performance client to get live stats in realtime card */}
    <UniverseAnalyticsInsightsClientProvider>
      <OnboardingTipsProvider>
        {/* Required by the overview Alerts card's `useAnalyticsAlertsListQuery` call. */}
        <AnalyticsAlertClientProvider client={analyticsAlertControlPlaneClient}>
          <ExperienceOverviewPageContent variant={variant} heroElement={heroElement} />
        </AnalyticsAlertClientProvider>
      </OnboardingTipsProvider>
    </UniverseAnalyticsInsightsClientProvider>
  </UniversePerformanceRaqiClientProvider>
);
export default ExperienceOverviewPage;
