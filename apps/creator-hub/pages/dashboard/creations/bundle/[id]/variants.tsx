import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import getBundlePageLayout from '@modules/creations/bundleConfiguration/layout/getBundlePageLayout';
import VerificationMetadataProvider from '@modules/creations/verification/hooks/VerificationMetadataProvider';
import BundleVariantsContainer from '../../../../../modules/creations/bundleConfiguration/components/BundleVariantsContainer';

const Variants: NextLayoutPage = () => (
  <Authenticated>
    <VerificationMetadataProvider>
      <BundleVariantsContainer />
    </VerificationMetadataProvider>
  </Authenticated>
);

Variants.getPageLayout = getBundlePageLayout;
Variants.loggerConfig = { rosId: RosTeams.AvatarMarketplace };

export default Variants;
