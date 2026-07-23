import { ReactNode } from 'react';

import AdIntegrationBreadcrumbs from '@components/adIntegrations/AdIntegrationBreadcrumbs';
import EditAdIntegrationCampaignDetails from '@components/adIntegrations/campaignDetails/EditAdIntegrationCampaignDetails';
import AdsManagerPageBaseLayout from '@components/common/AdsManagerDefaultLayout';
import { getCreatorHubPageLayout } from '@components/common/CreatorHubPageLayout';

const AdIntegrationsCampaignPage = () => (
  <AdsManagerPageBaseLayout isLoading={false}>
    <EditAdIntegrationCampaignDetails />
  </AdsManagerPageBaseLayout>
);

const getPageLayout = (page: ReactNode) =>
  getCreatorHubPageLayout(page, { header: <AdIntegrationBreadcrumbs /> });

AdIntegrationsCampaignPage.getPageLayout = getPageLayout;

export default AdIntegrationsCampaignPage;
