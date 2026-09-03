import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import ConfigureDeveloperItemContainer from '@modules/creations/developerItem/common/ConfigureDeveloperItemContainer/ConfigureDeveloperItemContainer';
import getDeveloperItemPageLayout from '@modules/creations/developerItem/common/getDeveloperItemPageLayout';
import MarketplacePublishingRequirementsContextProvider from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsProvider';

const Configure: NextLayoutPage = () => (
  <Authenticated>
    <MarketplacePublishingRequirementsContextProvider>
      <ConfigureDeveloperItemContainer />
    </MarketplacePublishingRequirementsContextProvider>
  </Authenticated>
);

Configure.getPageLayout = (page) =>
  getDeveloperItemPageLayout(page, {
    title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Configure' />,
  });
Configure.loggerConfig = { rosId: RosTeams.CreatorMarketplace };
export default Configure;
