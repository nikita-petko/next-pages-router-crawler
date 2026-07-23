import type { NextLayoutPage } from 'next';
import { analyticsSafetyNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import ExperienceAnalyticsSafetyPage from '@modules/experience-analytics/pages/Safety/SafetyOverviewPageContainer';

const SafetyOverviewPage: NextLayoutPage = () => {
  return <ExperienceAnalyticsSafetyPage />;
};

// Translation Key found in Navigation Namespace
SafetyOverviewPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsSafetyNavigationItem });
SafetyOverviewPage.loggerConfig = { rosId: RosTeams.Safety };

export default SafetyOverviewPage;
