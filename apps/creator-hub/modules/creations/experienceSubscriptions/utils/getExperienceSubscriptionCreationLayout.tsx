import { ReactNode } from 'react';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import GameProvider from '@modules/providers/game/GameProvider';
import ExperienceGuidelinesProvider from '@modules/experience-guidelines/providers/ExperienceGuidelinesProvider';
import GameLeftNavigation from '../../common/components/GameLeftNavigation';
import { CreationsCustomSettingsProvider } from '../../common/implementations/creationsCustomSettings';
import { ExperienceSubscriptionProvider } from '../index';

export default function getExperienceSubscriptionLayout(page: ReactNode) {
  return (
    <CreationsCustomSettingsProvider>
      <ExperienceGuidelinesProvider>
        <GameProvider>
          <ExperienceSubscriptionProvider>
            {/* NOTE(@zwang, 06/05/25): refer to `getCreationsPageLayout` */}
            <IALayoutExperiment
              leftNavigationContents={<GameLeftNavigation />}
              useExperienceNavigation>
              {page}
            </IALayoutExperiment>
          </ExperienceSubscriptionProvider>
        </GameProvider>
      </ExperienceGuidelinesProvider>
    </CreationsCustomSettingsProvider>
  );
}
