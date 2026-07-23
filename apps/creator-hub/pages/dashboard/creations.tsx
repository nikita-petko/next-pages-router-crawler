import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import AffiliateProgramProvider from '@modules/affiliate-program/providers/AffiliateProgramProvider';
import CreateAssetFormProvider from '@modules/asset-creation/components/providers/CreateAssetFormProvider';
import Authenticated from '@modules/authentication/Authenticated';
import CreationsIALeftNav from '@modules/creations/common/components/CreationsIALeftNav';
import useEnableCreationsNavLayout from '@modules/creations/common/hooks/useEnableCreationsNavLayout';
import CreationsMetadataContainer from '@modules/creations/home/containers/CreationsMetadataContainer';
import VerificationMetadataProvider from '@modules/creations/verification/hooks/VerificationMetadataProvider';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';

const CreationsPageLayout = ({ children }: { children: ReactNode }) => {
  const shouldUseCreationsNavLayout = useEnableCreationsNavLayout();

  return (
    <CreatorHubLayout
      title={
        <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Creations' />
      }
      secondaryRail={shouldUseCreationsNavLayout ? <CreationsIALeftNav /> : undefined}
      secondarySize={shouldUseCreationsNavLayout ? 'small' : undefined}
      noBreadCrumbs>
      <CreateAssetFormProvider>{children}</CreateAssetFormProvider>
    </CreatorHubLayout>
  );
};

const getCreationsPageLayout = (page: ReactNode) => (
  <CreationsPageLayout>{page}</CreationsPageLayout>
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
Creations.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default Creations;
