import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import CloudPricingClientProvider from '@modules/cloud-services/pricing/CloudPricingClientProvider';
import ServiceEfficiencyEligibilityContainer from '@modules/cloud-services/pricing/pages/ServiceEfficiencyEligibilityContainer/ServiceEfficiencyEligibilityContainer';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';

const getPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, {
    title: (
      <Translate
        namespace='CreatorDashboard.PageTitles'
        translationKey='Heading.ServiceEfficiency'
      />
    ),
  });

const ExtendedServicesPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ToolboxServiceApiProvider>
        <CloudPricingClientProvider>
          <ServiceEfficiencyEligibilityContainer />
        </CloudPricingClientProvider>
      </ToolboxServiceApiProvider>
    </Authenticated>
  );
};

ExtendedServicesPage.getPageLayout = getPageLayout;
ExtendedServicesPage.loggerConfig = { rosId: RosTeams.CreatorEconomy };

export default ExtendedServicesPage;
