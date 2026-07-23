import React, { FC } from 'react';
import {
  UniverseAnalyticsInsightsClientProvider,
  UniversePerformanceRaqiClientProvider,
  OnboardingTipsProvider,
} from '@modules/experience-analytics-shared';

import ExperienceOverviewPageContent from './ExperienceOverviewPageContent';

type ExperienceOverviewPageProps = {
  heroElement?: React.ReactElement;
};
const ExperienceOverviewPage: FC<ExperienceOverviewPageProps> = ({ heroElement }) => (
  <UniversePerformanceRaqiClientProvider>
    {/* need performance client to get live stats in realtime card */}
    <UniverseAnalyticsInsightsClientProvider>
      <OnboardingTipsProvider>
        <ExperienceOverviewPageContent heroElement={heroElement} />
      </OnboardingTipsProvider>
    </UniverseAnalyticsInsightsClientProvider>
  </UniversePerformanceRaqiClientProvider>
);
export default ExperienceOverviewPage;
