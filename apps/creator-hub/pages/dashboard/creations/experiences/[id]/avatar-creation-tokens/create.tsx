import type { NextLayoutPage } from 'next';
import {
  CreateAvatarCreationTokenForm,
  getAvatarCreationTokenCreateLayout,
} from '@modules/creations';
import Authenticated from '@modules/authentication/Authenticated';

const AvatarCreationTokenCreate: NextLayoutPage = () => {
  return (
    <Authenticated>
      <CreateAvatarCreationTokenForm />
    </Authenticated>
  );
};

AvatarCreationTokenCreate.getPageLayout = getAvatarCreationTokenCreateLayout;

export default AvatarCreationTokenCreate;
