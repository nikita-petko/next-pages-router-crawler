import type { ReactNode } from 'react';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import GameProvider from '@modules/providers/game/GameProvider';
import TranslationLeftNavigation from '../components/LeftNavigation';
import TranslationLogicProvider from '../providers/TranslationLogicProvider';

export type TGetTranslationPersistentLayoutContext = { title?: string | ReactNode };

const getTranslationPersistentLayout = (
  page: ReactNode,
  { title }: TGetTranslationPersistentLayoutContext,
) => {
  return (
    <GameProvider>
      <TranslationLogicProvider>
        <CreatorHubLayout title={title} leftNavigationContents={<TranslationLeftNavigation />}>
          {page}
        </CreatorHubLayout>
      </TranslationLogicProvider>
    </GameProvider>
  );
};

export default getTranslationPersistentLayout;
