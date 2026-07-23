/* istanbul ignore file */
import Authenticated from '@modules/authentication/Authenticated';
import LanguageManagementProvider from '@modules/localization/localization/providers/LanguageManagementProvider';
import GameProvider from '@modules/providers/game/GameProvider';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import {
  CreationsCustomSettingsProvider,
  TGetCreationsPageLayoutContext,
} from '@modules/creations/common';
import AssociatedItemLeftNavigation from '../../associatedItems/components/AssociatedItemLeftNavigation';
import { DeveloperProductProvider } from '../contexts/DeveloperProductContext';

const getDeveloperProductLayout = (
  page: React.ReactNode,
  context: TGetCreationsPageLayoutContext,
) => {
  return (
    <Authenticated>
      <CreationsCustomSettingsProvider>
        <GameProvider>
          <LanguageManagementProvider>
            <DeveloperProductProvider>
              <IALayoutExperiment
                useExperienceNavigation
                leftNavigationContents={<AssociatedItemLeftNavigation />}
                {...context}>
                {page}
              </IALayoutExperiment>
            </DeveloperProductProvider>
          </LanguageManagementProvider>
        </GameProvider>
      </CreationsCustomSettingsProvider>
    </Authenticated>
  );
};

export default getDeveloperProductLayout;
