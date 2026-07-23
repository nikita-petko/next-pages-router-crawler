import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import LookConfigureContainer from '@modules/creations/look/components/LookConfigureContainer';
import useCurrentLook from '@modules/creations/look/hooks/useCurrentLook';
import getLookPageLayout from '@modules/creations/look/layout/getLookPageLayout';
import VerificationMetadataProvider from '@modules/creations/verification/hooks/VerificationMetadataProvider';

const Configure: NextLayoutPage = () => {
  const { lookDetail } = useCurrentLook();
  return (
    <Authenticated>
      <VerificationMetadataProvider>
        <LookConfigureContainer key={lookDetail?.lookId} />
      </VerificationMetadataProvider>
    </Authenticated>
  );
};

Configure.getPageLayout = getLookPageLayout;
Configure.loggerConfig = { rosId: RosTeams.AvatarMarketplace };

export default Configure;
