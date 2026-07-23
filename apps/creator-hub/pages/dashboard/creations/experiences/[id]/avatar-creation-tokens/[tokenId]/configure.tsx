import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import Authenticated from '@modules/authentication/Authenticated';
import ConfigureAvatarCreationTokenForm from '@modules/creations/avatarCreationTokens/components/Forms/ConfigureAvatarCreationTokenForm';
import getAvatarCreationTokenConfigureLayout from '@modules/creations/avatarCreationTokens/utils/getAvatarCreationTokenConfigureLayout';

const AvatarCreationTokenConfigure: NextLayoutPage = () => {
  const router = useRouter();
  const tokenId = String(router.query.tokenId);

  return (
    <Authenticated>
      <ConfigureAvatarCreationTokenForm tokenId={tokenId} />
    </Authenticated>
  );
};

AvatarCreationTokenConfigure.getPageLayout = getAvatarCreationTokenConfigureLayout;
AvatarCreationTokenConfigure.loggerConfig = { rosId: RosTeams.AvatarMarketplace };

export default AvatarCreationTokenConfigure;
