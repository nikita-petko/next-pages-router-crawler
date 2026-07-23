import { ReactNode } from 'react';

import AdIntegrationBreadcrumbs from '@components/adIntegrations/AdIntegrationBreadcrumbs';
import CreateAdIntegrationCampaignDetails from '@components/adIntegrations/campaignDetails/CreateAdIntegrationCampaignDetails';
import AdsManagerPageBaseLayout from '@components/common/AdsManagerDefaultLayout';
import { getCreatorHubPageLayout } from '@components/common/CreatorHubPageLayout';

const AdIntegrationsCreatePage = () => (
  <AdsManagerPageBaseLayout isLoading={false}>
    <CreateAdIntegrationCampaignDetails />
  </AdsManagerPageBaseLayout>
);

const getPageLayout = (page: ReactNode) =>
  getCreatorHubPageLayout(page, { header: <AdIntegrationBreadcrumbs /> });

AdIntegrationsCreatePage.getPageLayout = getPageLayout;

export default AdIntegrationsCreatePage;
