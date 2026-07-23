import type { NextLayoutPage } from 'next';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import DeveloperProductsPageTitle from '@modules/experience-monetization/pages/DeveloperProducts/DeveloperProductsPageTitle';
import DeveloperProductsPageContentContainer from '@modules/experience-monetization/pages/DeveloperProducts/DeveloperProductsPageContentContainer';

const DeveloperProductsPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  if (!universeId) return null;

  return <DeveloperProductsPageContentContainer universeId={universeId} />;
};

DeveloperProductsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    noNavigationItem: true,
    context: { title: <DeveloperProductsPageTitle /> },
  });

export default DeveloperProductsPage;
