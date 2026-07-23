import type { NextLayoutPage } from 'next';
import { analyticsAvatarCreationTokensNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import AvatarCreationTokensPageContentContainer from '@modules/experience-monetization/pages/AvatarCreationTokens/AvatarCreationTokensPageContentContainer';

const AvatarCreationTokensPage: NextLayoutPage = () => {
  return <AvatarCreationTokensPageContentContainer />;
};

AvatarCreationTokensPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsAvatarCreationTokensNavigationItem });
AvatarCreationTokensPage.loggerConfig = { rosId: RosTeams.AvatarMarketplace };

export default AvatarCreationTokensPage;
