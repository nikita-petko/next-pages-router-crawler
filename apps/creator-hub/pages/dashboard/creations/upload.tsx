import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import CreateAssetContainer from '@modules/asset-creation/components/CreateAssetContainer';
import CreateAssetFormProvider from '@modules/asset-creation/components/providers/CreateAssetFormProvider';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import { VerificationMetadataProvider } from '@modules/creations/verification';

const getCreationsPageLayout = (page: ReactNode) => (
  <IALayoutExperiment title='Heading.Creations'>
    <CreateAssetFormProvider>{page}</CreateAssetFormProvider>
  </IALayoutExperiment>
);

const Create: NextLayoutPage = () => (
  <Authenticated>
    <ToolboxServiceApiProvider>
      <VerificationMetadataProvider>
        <CreateAssetContainer />
      </VerificationMetadataProvider>
    </ToolboxServiceApiProvider>
  </Authenticated>
);

Create.getPageLayout = getCreationsPageLayout;

export default Create;
