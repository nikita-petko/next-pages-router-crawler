import type { ReactNode } from 'react';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import ExperienceGuidelinesProvider from '@modules/experience-guidelines/providers/ExperienceGuidelinesProvider';
import GameProvider from '@modules/providers/game/GameProvider';
import GameLeftNavigation from '../../common/components/GameLeftNavigation';
import { CreationsCustomSettingsProvider } from '../../common/implementations/creationsCustomSettings';
import ExperienceSubscriptionProvider from '../components/ExperienceSubscriptionProvider';

export default function getExperienceSubscriptionLayout(page: ReactNode) {
  return (
    <CreationsCustomSettingsProvider>
      <ExperienceGuidelinesProvider>
        <GameProvider>
          <ExperienceSubscriptionProvider>
            {/* NOTE(@zwang, 06/05/25): refer to `getCreationsPageLayout` */}
            <CreatorHubLayout leftNavigationContents={<GameLeftNavigation />}>
              {page}
            </CreatorHubLayout>
          </ExperienceSubscriptionProvider>
        </GameProvider>
      </ExperienceGuidelinesProvider>
    </CreationsCustomSettingsProvider>
  );
}
