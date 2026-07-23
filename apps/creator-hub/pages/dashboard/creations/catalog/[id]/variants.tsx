import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { VerificationMetadataProvider } from '@modules/creations/verification';
import { getAssetPageLayout } from '@modules/creations';
import AssetVariantsContainer from '../../../../../modules/creations/asset/components/AssetVariantsContainer';

const Variants: NextLayoutPage = () => (
  <Authenticated>
    <VerificationMetadataProvider>
      <AssetVariantsContainer />
    </VerificationMetadataProvider>
  </Authenticated>
);

Variants.getPageLayout = getAssetPageLayout;

export default Variants;
