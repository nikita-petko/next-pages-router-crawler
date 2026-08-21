import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import { SnackbarProvider } from '@rbx/ui';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import SocialLinksContainer from '@modules/creations/socialLinks/components/SocialLinksContainer';
import GameProvider from '@modules/providers/game/GameProvider';

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
  getCreationsPageLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.SocialLinks' />
    ),
  });
SocialLinks.loggerConfig = { rosId: RosTeams.DiscoveryUX };

export default SocialLinks;
