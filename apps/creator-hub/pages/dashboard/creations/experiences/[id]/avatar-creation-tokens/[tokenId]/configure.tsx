import type { NextLayoutPage } from 'next';
import {
  ConfigureAvatarCreationTokenForm,
  getAvatarCreationTokenConfigureLayout,
} from '@modules/creations';
import { useRouter } from 'next/router';
import Authenticated from '@modules/authentication/Authenticated';

const AvatarCreationTokenConfigure: NextLayoutPage = () => {
  const router = useRouter();
  const { tokenId } = router.query;

  return (
    <Authenticated>
      <ConfigureAvatarCreationTokenForm tokenId={tokenId as string} />
    </Authenticated>
  );
};

AvatarCreationTokenConfigure.getPageLayout = getAvatarCreationTokenConfigureLayout;

export default AvatarCreationTokenConfigure;
