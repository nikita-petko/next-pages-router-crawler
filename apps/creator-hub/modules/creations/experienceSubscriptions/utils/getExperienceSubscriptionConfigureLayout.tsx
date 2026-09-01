import type { ReactNode } from 'react';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import GameProvider from '@modules/providers/game/GameProvider';
import AssociatedItemLeftNavigation from '../../associatedItems/components/AssociatedItemLeftNavigation';
import ExperienceSubscriptionProvider from '../components/ExperienceSubscriptionProvider';

export default function getExperienceSubscriptionConfigureLayout(page: ReactNode) {
  return (
    <GameProvider>
      <ExperienceSubscriptionProvider>
        {/* NOTE(@zwang, 06/05/25): refer to `getCreationsPageLayout` */}
        <CreatorHubLayout leftNavigationContents={<AssociatedItemLeftNavigation />}>
          {page}
        </CreatorHubLayout>
      </ExperienceSubscriptionProvider>
    </GameProvider>
  );
}
