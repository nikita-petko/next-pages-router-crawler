import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import getBundlePageLayout from '@modules/creations/bundleConfiguration/layout/getBundlePageLayout';
import ItemConfigureContainer from '@modules/creations/itemConfiguration/components/ItemConfigureContainer';

const Configure: NextLayoutPage = () => (
  <Authenticated>
    <ItemConfigureContainer />
  </Authenticated>
);

Configure.getPageLayout = getBundlePageLayout;
Configure.loggerConfig = { rosId: RosTeams.AvatarMarketplace };

export default Configure;
