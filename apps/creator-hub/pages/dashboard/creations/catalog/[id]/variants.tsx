import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import getAssetPageLayout from '@modules/creations/asset/layout/getAssetPageLayout';
import VerificationMetadataProvider from '@modules/creations/verification/hooks/VerificationMetadataProvider';
import AssetVariantsContainer from '../../../../../modules/creations/asset/components/AssetVariantsContainer';

const Variants: NextLayoutPage = () => (
  <Authenticated>
    <VerificationMetadataProvider>
      <AssetVariantsContainer />
    </VerificationMetadataProvider>
  </Authenticated>
);

Variants.getPageLayout = getAssetPageLayout;
Variants.loggerConfig = { rosId: RosTeams.AvatarMarketplace };

export default Variants;
