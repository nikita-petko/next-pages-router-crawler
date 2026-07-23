import { ReactNode } from 'react';
import GameProvider from '@modules/providers/game/GameProvider';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import TranslationLeftNavigation from '../components/LeftNavigation';
import TranslationLogicProvider from '../providers/TranslationLogicProvider';

export type TGetTranslationPersistentLayoutContext = { title?: string };

const getTranslationPersistentLayout = (
  page: ReactNode,
  { title }: TGetTranslationPersistentLayoutContext,
) => {
  return (
    <GameProvider>
      <TranslationLogicProvider>
        <IALayoutExperiment title={title} leftNavigationContents={<TranslationLeftNavigation />}>
          {page}
        </IALayoutExperiment>
      </TranslationLogicProvider>
    </GameProvider>
  );
};

export default getTranslationPersistentLayout;
