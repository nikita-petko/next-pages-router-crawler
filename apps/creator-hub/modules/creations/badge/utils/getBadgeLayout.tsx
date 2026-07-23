import type { ReactNode } from 'react';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import LanguageManagementProvider from '@modules/localization/localization/providers/LanguageManagementProvider';
import GameProvider from '@modules/providers/game/GameProvider';
import AssociatedItemLeftNavigation from '../../associatedItems/components/AssociatedItemLeftNavigation';
import BadgeProvider from '../providers/BadgeProvider';

const getBadgeLayout = (page: ReactNode, { title }: { title: string | ReactNode }) => {
  return (
    <GameProvider>
      <LanguageManagementProvider>
        <BadgeProvider>
          <CreatorHubLayout title={title} leftNavigationContents={<AssociatedItemLeftNavigation />}>
            {page}
          </CreatorHubLayout>
        </BadgeProvider>
      </LanguageManagementProvider>
    </GameProvider>
  );
};

export default getBadgeLayout;
