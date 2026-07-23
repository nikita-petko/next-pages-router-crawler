import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { CreationsMetadataContainer } from '@modules/creations';
import { VerificationMetadataProvider } from '@modules/creations/verification';
// eslint-disable-next-line no-restricted-imports -- There are unrestricted imports needing to be cleaned up by file owner (@blarouche)
import CreateAssetFormProvider from '@modules/asset-creation/components/providers/CreateAssetFormProvider';
import AffiliateProgramProvider from '@modules/affiliate-program/providers/AffiliateProgramProvider';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';

const getCreationsPageLayout = (page: ReactNode) => (
  <IALayoutExperiment title='Heading.Creations' noBreadCrumbs>
    <CreateAssetFormProvider>{page}</CreateAssetFormProvider>
  </IALayoutExperiment>
);

const Creations: NextLayoutPage = () => {
  return (
    <Authenticated>
      <VerificationMetadataProvider>
        <AffiliateProgramProvider>
          <CreationsMetadataContainer />
        </AffiliateProgramProvider>
      </VerificationMetadataProvider>
    </Authenticated>
  );
};

Creations.getPageLayout = getCreationsPageLayout;

export default Creations;
