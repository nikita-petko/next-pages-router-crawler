import { ReactNode } from 'react';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import GameProvider from '@modules/providers/game/GameProvider';
import { ExperienceSubscriptionProvider } from '../index';
import AssociatedItemLeftNavigation from '../../associatedItems/components/AssociatedItemLeftNavigation';

export default function getExperienceSubscriptionConfigureLayout(page: ReactNode) {
  return (
    <GameProvider>
      <ExperienceSubscriptionProvider>
        {/* NOTE(@zwang, 06/05/25): refer to `getCreationsPageLayout` */}
        <IALayoutExperiment
          leftNavigationContents={<AssociatedItemLeftNavigation />}
          useExperienceNavigation>
          {page}
        </IALayoutExperiment>
      </ExperienceSubscriptionProvider>
    </GameProvider>
  );
}
