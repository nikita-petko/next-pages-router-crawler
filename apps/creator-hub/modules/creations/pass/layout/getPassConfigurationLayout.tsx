/* istanbul ignore file */
import { ReactNode } from 'react';
import GameProvider from '@modules/providers/game/GameProvider';
import LanguageManagementProvider from '@modules/localization/localization/providers/LanguageManagementProvider';
import Authenticated from '@modules/authentication/Authenticated';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import { CreationsCustomSettingsProvider } from '@modules/creations/common';
import { PassProvider } from '../contexts/PassContext';
import PassItemLeftNavigation from '../common/PassItemLeftNavigation/PassItemLeftNavigation';

const getPassConfigurationLayout = (page: ReactNode, { title }: { title: string }) => {
  return (
    <Authenticated>
      <CreationsCustomSettingsProvider>
        <GameProvider>
          <LanguageManagementProvider>
            <PassProvider>
              <IALayoutExperiment
                title={title}
                useExperienceNavigation
                leftNavigationContents={<PassItemLeftNavigation />}>
                {page}
              </IALayoutExperiment>
            </PassProvider>
          </LanguageManagementProvider>
        </GameProvider>
      </CreationsCustomSettingsProvider>
    </Authenticated>
  );
};

export default getPassConfigurationLayout;
