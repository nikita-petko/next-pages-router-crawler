import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import CreateAvatarCreationTokenForm from '@modules/creations/avatarCreationTokens/components/Forms/CreateAvatarCreationTokenForm';
import getAvatarCreationTokenCreateLayout from '@modules/creations/avatarCreationTokens/utils/getAvatarCreationTokenCreateLayout';

const AvatarCreationTokenCreate: NextLayoutPage = () => {
  return (
    <Authenticated>
      <CreateAvatarCreationTokenForm />
    </Authenticated>
  );
};

AvatarCreationTokenCreate.getPageLayout = getAvatarCreationTokenCreateLayout;
AvatarCreationTokenCreate.loggerConfig = { rosId: RosTeams.AvatarMarketplace };

export default AvatarCreationTokenCreate;
