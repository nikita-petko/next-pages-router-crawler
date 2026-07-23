import type { NextLayoutPage } from 'next';
import { analyticsAudienceNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import ExperienceAnalyticsAudiencePage from '@modules/experience-analytics/pages/AudiencePageRAQI/AudiencePageRAQIContent';

const AudienceAnalyticsPage: NextLayoutPage = () => {
  return <ExperienceAnalyticsAudiencePage />;
};

AudienceAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsAudienceNavigationItem });
AudienceAnalyticsPage.loggerConfig = { rosId: RosTeams.Analytics };

export default AudienceAnalyticsPage;
