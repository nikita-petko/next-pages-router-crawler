import type { NextLayoutPage } from 'next';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import DeveloperProductsPageContentContainer from '@modules/experience-monetization/pages/DeveloperProducts/DeveloperProductsPageContentContainer';
import DeveloperProductsPageTitle from '@modules/experience-monetization/pages/DeveloperProducts/DeveloperProductsPageTitle';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';

const DeveloperProductsPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  if (!universeId) {
    return null;
  }

  return <DeveloperProductsPageContentContainer universeId={universeId} />;
};

DeveloperProductsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    noNavigationItem: true,
    context: { title: <DeveloperProductsPageTitle /> },
  });
DeveloperProductsPage.loggerConfig = { rosId: RosTeams.MonetizationProducts };

export default DeveloperProductsPage;
