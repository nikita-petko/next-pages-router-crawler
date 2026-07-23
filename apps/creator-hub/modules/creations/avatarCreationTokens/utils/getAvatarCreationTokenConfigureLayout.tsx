import { ReactNode } from 'react';
import GameProvider from '@modules/providers/game/GameProvider';
// eslint-disable-next-line no-restricted-imports -- deep import; localization root barrel removed
import LanguageManagementProvider from '@modules/localization/localization/providers/LanguageManagementProvider';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import GameLeftNavigation from '../../common/components/GameLeftNavigation';

const getAvatarCreationTokenConfigureLayout = (page: ReactNode) => {
  return (
    <GameProvider>
      <LanguageManagementProvider>
        <IALayoutExperiment leftNavigationContents={<GameLeftNavigation />} useExperienceNavigation>
          {page}
        </IALayoutExperiment>
      </LanguageManagementProvider>
    </GameProvider>
  );
};

export default getAvatarCreationTokenConfigureLayout;
