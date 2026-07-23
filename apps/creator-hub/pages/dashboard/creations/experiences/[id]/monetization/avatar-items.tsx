import type { NextLayoutPage } from 'next';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import AvatarItemsPageContentContainer from '@modules/experience-monetization/pages/AvatarItems/AvatarItemsPageContentContainer';
import AvatarItemsPageTitle from '@modules/experience-monetization/pages/AvatarItems/AvatarItemsPageTitle';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';

const AvatarItemsPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();

  if (!universeId) {
    return null;
  }

  return <AvatarItemsPageContentContainer />;
};

AvatarItemsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    noNavigationItem: true,
    context: { title: <AvatarItemsPageTitle /> },
  });
AvatarItemsPage.loggerConfig = { rosId: RosTeams.AvatarMarketplace };

export default AvatarItemsPage;
