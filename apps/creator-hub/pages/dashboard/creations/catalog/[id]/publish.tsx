import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import getAssetPageLayout from '@modules/creations/asset/layout/getAssetPageLayout';
import ItemConfigureContainer from '@modules/creations/itemConfiguration/components/ItemConfigureContainer';
import VerificationMetadataProvider from '@modules/creations/verification/hooks/VerificationMetadataProvider';

const Configure: NextLayoutPage = () => (
  <Authenticated>
    <VerificationMetadataProvider>
      <ItemConfigureContainer />
    </VerificationMetadataProvider>
  </Authenticated>
);

Configure.getPageLayout = getAssetPageLayout;
Configure.loggerConfig = { rosId: RosTeams.AvatarMarketplace };

export default Configure;
