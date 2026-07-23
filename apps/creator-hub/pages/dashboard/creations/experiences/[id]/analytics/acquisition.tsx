import React from 'react';
import type { NextLayoutPage } from 'next';
import { analyticsUserAcquisitionNavigationItem } from '@modules/charts-generic';
import {
  getAnalyticsPageLayout,
  OnboardingTipsProvider,
} from '@modules/experience-analytics-shared';
import ExperienceAnalyticsUserAcquisitionPageV2 from '@modules/experience-analytics/pages/AcquisitionPageV2/AcquisitionPageContent';

const AnalyticsAcquisitionPage: NextLayoutPage = () => {
  return (
    <OnboardingTipsProvider>
      <ExperienceAnalyticsUserAcquisitionPageV2 />
    </OnboardingTipsProvider>
  );
};

AnalyticsAcquisitionPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsUserAcquisitionNavigationItem });

export default AnalyticsAcquisitionPage;
