import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import MarketplaceFiatServiceProvider from '@modules/marketplaceFiatService/MarketplaceFiatServiceProvider';
import MarketplacePublishingRequirementsContextProvider from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsProvider';
import SellerOnboarding from '@modules/seller-onboarding/components/SellerOnboarding';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';

const getPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.PricedAssets' />
    ),
  });

const PricedAssetsPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <MarketplacePublishingRequirementsContextProvider>
        <ToolboxServiceApiProvider>
          <MarketplaceFiatServiceProvider>
            <SellerOnboarding />
          </MarketplaceFiatServiceProvider>
        </ToolboxServiceApiProvider>
      </MarketplacePublishingRequirementsContextProvider>
    </Authenticated>
  );
};

PricedAssetsPage.getPageLayout = getPageLayout;
PricedAssetsPage.loggerConfig = { rosId: RosTeams.CreatorMarketplace };

export default PricedAssetsPage;
