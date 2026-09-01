import type { NextLayoutPage } from 'next';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import CreatePlacementPageContent from '@modules/immersive-ads/pages/CreatePlacementPageContent';

const CreatePlacementPage: NextLayoutPage = () => {
  return <CreatePlacementPageContent />;
};

CreatePlacementPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { noNavigationItem: true });
CreatePlacementPage.loggerConfig = { rosId: RosTeams.AdvertiserPublisherExperience };

export default CreatePlacementPage;
