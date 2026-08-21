import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import CreateAssetContainer from '@modules/asset-creation/components/CreateAssetContainer';
import CreateAssetFormProvider from '@modules/asset-creation/components/providers/CreateAssetFormProvider';
import Authenticated from '@modules/authentication/Authenticated';
import VerificationMetadataProvider from '@modules/creations/verification/hooks/VerificationMetadataProvider';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';

const getCreationsPageLayout = (page: ReactNode) => (
  <CreatorHubLayout
    omitPageTitle
    title={
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Creations' />
    }>
    <CreateAssetFormProvider>{page}</CreateAssetFormProvider>
  </CreatorHubLayout>
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
Create.loggerConfig = { rosId: RosTeams.Publishing };

export default Create;
