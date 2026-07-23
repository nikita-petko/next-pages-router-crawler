import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import Authenticated from '@modules/authentication/Authenticated';
import CloudPricingClientProvider from '@modules/cloud-services/pricing/CloudPricingClientProvider';
import ServiceEfficiencyEligibilityContainer from '@modules/cloud-services/pricing/pages/ServiceEfficiencyEligibilityContainer/ServiceEfficiencyEligibilityContainer';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';

const getPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, { title: 'Heading.ServiceEfficiency' });

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

export default ExtendedServicesPage;
