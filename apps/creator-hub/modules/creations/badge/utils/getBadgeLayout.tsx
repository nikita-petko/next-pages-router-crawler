import { ReactNode } from 'react';
import GameProvider from '@modules/providers/game/GameProvider';
// eslint-disable-next-line no-restricted-imports -- deep import; localization root barrel removed
import LanguageManagementProvider from '@modules/localization/localization/providers/LanguageManagementProvider';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import AssociatedItemLeftNavigation from '../../associatedItems/components/AssociatedItemLeftNavigation';
import BadgeProvider from '../providers/BadgeProvider';

const getBadgeLayout = (page: ReactNode, { title }: { title: string }) => {
  return (
    <GameProvider>
      <LanguageManagementProvider>
        <BadgeProvider>
          <IALayoutExperiment
            title={title}
            useExperienceNavigation
            leftNavigationContents={<AssociatedItemLeftNavigation />}>
            {page}
          </IALayoutExperiment>
        </BadgeProvider>
      </LanguageManagementProvider>
    </GameProvider>
  );
};

export default getBadgeLayout;
