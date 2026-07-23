import type { NextLayoutPage } from 'next';
import { analyticsUserAcquisitionNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { OnboardingTipsProvider } from '@modules/experience-analytics-shared/context/OnboardingTipsProvider';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
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
AnalyticsAcquisitionPage.loggerConfig = { rosId: RosTeams.Analytics };

export default AnalyticsAcquisitionPage;
