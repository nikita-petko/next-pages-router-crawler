import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import FiatPaidAccessPageContent from '@modules/fiat-paid-access/pages/FiatPaidAccess/FiatPaidAccessPageContent';
import MarketplacePublishingRequirementsContextProvider from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsProvider';

const getPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.PageTitles' translationKey='Heading.PaidAccessFiat' />
    ),
  });

const PaidAccessPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <MarketplacePublishingRequirementsContextProvider>
        <FiatPaidAccessPageContent />
      </MarketplacePublishingRequirementsContextProvider>
    </Authenticated>
  );
};

PaidAccessPage.getPageLayout = getPageLayout;
PaidAccessPage.loggerConfig = { rosId: RosTeams.MonetizationProducts };

export default PaidAccessPage;
