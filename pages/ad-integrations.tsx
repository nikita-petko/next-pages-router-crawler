import { ReactNode } from 'react';

import AdIntegrationsListPage from '@components/adIntegrations/AdIntegrationsListPage';
import AdsManagerPageBaseLayout from '@components/common/AdsManagerDefaultLayout';
import { getCreatorHubPageLayout } from '@components/common/CreatorHubPageLayout';
import { TranslationNamespace } from '@constants/localization';

const AdIntegrationsPage = () => (
  <AdsManagerPageBaseLayout isLoading={false}>
    <AdIntegrationsListPage />
  </AdsManagerPageBaseLayout>
);

const getPageLayout = (page: ReactNode) =>
  getCreatorHubPageLayout(page, {
    headerKey: 'Heading.AdIntegrations',
    headerNamespace: TranslationNamespace.Account,
  });

AdIntegrationsPage.getPageLayout = getPageLayout;

export default AdIntegrationsPage;
