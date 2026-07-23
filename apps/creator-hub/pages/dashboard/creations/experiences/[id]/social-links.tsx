import { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import GameProvider from '@modules/providers/game/GameProvider';
import { getCreationsPageLayout, SocialLinksContainer } from '@modules/creations';
import { SnackbarProvider } from '@rbx/ui';

const SocialLinks: NextLayoutPage = () => {
  return (
    <Authenticated>
      <GameProvider>
        <SnackbarProvider data-testid='social-link-snackbar'>
          <SocialLinksContainer />
        </SnackbarProvider>
      </GameProvider>
    </Authenticated>
  );
};

SocialLinks.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: 'Heading.SocialLinks' });

export default SocialLinks;
