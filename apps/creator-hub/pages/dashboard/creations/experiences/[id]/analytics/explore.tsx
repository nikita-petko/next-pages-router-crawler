import type { NextLayoutPage } from 'next';
import { analyticsExploreNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { useMarkExploreModeNavSeenOnAnalyticsPageVisit } from '@modules/experience-analytics-shared/exploreMode/useMarkExploreModeNavSeenOnAnalyticsPageVisit';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import ExperienceAnalyticsExploreMode from '@modules/experience-analytics/pages/ExploreMode/ExperienceAnalyticsExploreModePageContainer';

const AnalyticsExploreMode: NextLayoutPage = () => {
  useMarkExploreModeNavSeenOnAnalyticsPageVisit();
  return <ExperienceAnalyticsExploreMode />;
};

AnalyticsExploreMode.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsExploreNavigationItem });
AnalyticsExploreMode.loggerConfig = { rosId: RosTeams.Analytics };

export default AnalyticsExploreMode;
