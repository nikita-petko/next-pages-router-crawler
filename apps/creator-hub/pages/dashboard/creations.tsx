import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useTranslation } from '@rbx/intl';
import AffiliateProgramProvider from '@modules/affiliate-program/providers/AffiliateProgramProvider';
import CreateAssetFormProvider from '@modules/asset-creation/components/providers/CreateAssetFormProvider';
import Authenticated from '@modules/authentication/Authenticated';
import CreationsIALeftNav, {
  useCreationsNavigation,
} from '@modules/creations/common/components/CreationsIALeftNav';
import CreationsMetadataContainer from '@modules/creations/home/containers/CreationsMetadataContainer';
import VerificationMetadataProvider from '@modules/creations/verification/hooks/VerificationMetadataProvider';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';

const CreationsPageTitle = () => {
  const { translate } = useTranslation();
  const { activeItem } = useCreationsNavigation();

  return (
    <h1 className='text-heading-large margin-none'>
      {activeItem?.label ?? translate('Heading.Creations')}
    </h1>
  );
};

const CreationsPageLayout = ({ children }: { children: ReactNode }) => {
  return (
    <CreatorHubLayout
      title={<CreationsPageTitle />}
      secondaryRail={<CreationsIALeftNav />}
      secondarySize='small'
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
