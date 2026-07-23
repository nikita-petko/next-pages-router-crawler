import { ReactNode } from 'react';

import AdIntegrationsLandingPage from '@components/adIntegrations/AdIntegrationsLandingPage';
import AdsManagerPageBaseLayout from '@components/common/AdsManagerDefaultLayout';
import { getCreatorHubPageLayout } from '@components/common/CreatorHubPageLayout';
import { TranslationNamespace } from '@constants/localization';

const AdIntegrationsLandingRoutePage = () => (
  <AdsManagerPageBaseLayout isLoading={false}>
    <AdIntegrationsLandingPage />
  </AdsManagerPageBaseLayout>
);

const getPageLayout = (page: ReactNode) =>
  getCreatorHubPageLayout(page, {
    headerKey: 'Heading.AdIntegrations',
    headerNamespace: TranslationNamespace.Account,
  });

AdIntegrationsLandingRoutePage.getPageLayout = getPageLayout;

export default AdIntegrationsLandingRoutePage;
