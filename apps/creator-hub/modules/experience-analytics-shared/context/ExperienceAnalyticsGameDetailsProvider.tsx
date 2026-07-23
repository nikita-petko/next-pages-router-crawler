import { FormattedText } from '@modules/analytics-translations';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';
import React, { FC, useContext, useMemo } from 'react';

type ExperienceAnalyticsGameDetailsContextType = {
  isLoadingGame: boolean;
  rootPlaceId: number;
  universeId: number;
  universeName: FormattedText; // string but we cast it since it can't be translated
};

export const ExperienceAnalyticsGameDetailsContext =
  React.createContext<ExperienceAnalyticsGameDetailsContextType>({
    universeId: uninitializedUniverseId,
    rootPlaceId: uninitializedUniverseId,
    universeName: '' as FormattedText,
    isLoadingGame: true,
  });

export const useExperienceAnalyticsGameDetails = (): ExperienceAnalyticsGameDetailsContextType => {
  return useContext(ExperienceAnalyticsGameDetailsContext);
};

const ExperienceAnalyticsGameDetailsProvider: FC<React.PropsWithChildren> = ({ children }) => {
  const { gameDetails, isLoadingGame } = useCurrentGame();
  const universeName = (gameDetails?.name ?? '') as FormattedText;
  const universeId = gameDetails?.id ?? uninitializedUniverseId;
  const rootPlaceId = gameDetails?.rootPlaceId ?? uninitializedUniverseId;
  const context = useMemo(() => {
    return { isLoadingGame, universeId, universeName, rootPlaceId };
  }, [isLoadingGame, universeId, universeName, rootPlaceId]);
  return (
    <ExperienceAnalyticsGameDetailsContext.Provider value={context}>
      {children}
    </ExperienceAnalyticsGameDetailsContext.Provider>
  );
};

export default ExperienceAnalyticsGameDetailsProvider;
