import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import Authenticated from '@modules/authentication/Authenticated';
import SellerOnboarding from '@modules/seller-onboarding/components/SellerOnboarding';
import MarketplaceFiatServiceProvider from '@modules/marketplaceFiatService/MarketplaceFiatServiceProvider';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';

const getPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, { title: 'Heading.PricedAssets' });

const PricedAssetsPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ToolboxServiceApiProvider>
        <MarketplaceFiatServiceProvider>
          <SellerOnboarding />
        </MarketplaceFiatServiceProvider>
      </ToolboxServiceApiProvider>
    </Authenticated>
  );
};

PricedAssetsPage.getPageLayout = getPageLayout;

export default PricedAssetsPage;
