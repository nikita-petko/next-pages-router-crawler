import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { VerificationMetadataProvider } from '@modules/creations/verification';
import { getBundlePageLayout } from '@modules/creations';
import BundleVariantsContainer from '../../../../../modules/creations/bundleConfiguration/components/BundleVariantsContainer';

const Variants: NextLayoutPage = () => (
  <Authenticated>
    <VerificationMetadataProvider>
      <BundleVariantsContainer />
    </VerificationMetadataProvider>
  </Authenticated>
);

Variants.getPageLayout = getBundlePageLayout;

export default Variants;
