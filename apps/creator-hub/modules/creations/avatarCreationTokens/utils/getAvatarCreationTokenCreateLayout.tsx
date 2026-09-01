import type { ReactNode } from 'react';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import LanguageManagementProvider from '@modules/localization/localization/providers/LanguageManagementProvider';
import GameProvider from '@modules/providers/game/GameProvider';
import GameLeftNavigation from '../../common/components/GameLeftNavigation';

const getAvatarCreationTokenCreateLayout = (page: ReactNode) => {
  return (
    <GameProvider>
      <LanguageManagementProvider>
        <CreatorHubLayout leftNavigationContents={<GameLeftNavigation />}>{page}</CreatorHubLayout>
      </LanguageManagementProvider>
    </GameProvider>
  );
};

export default getAvatarCreationTokenCreateLayout;
