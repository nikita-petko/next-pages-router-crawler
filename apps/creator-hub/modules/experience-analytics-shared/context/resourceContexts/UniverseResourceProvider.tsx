import type { FunctionComponent } from 'react';
import React, { createContext, useCallback, useMemo } from 'react';
import ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import type { ChartResourceContextType } from '../../types/ChartResourceContextType';

export const UniverseResourceContext = createContext<ChartResourceContextType | null>({
  getChartResource: () => {
    return { id: uninitializedUniverseId, type: ChartResourceType.Universe, isLoading: true };
  },
});
UniverseResourceContext.displayName = 'UniverseResourceContext';

export const UniverseResourceProvider: FunctionComponent<React.PropsWithChildren> = ({
  children,
}) => {
  const { gameDetails } = useCurrentGame();
  const universeId = gameDetails?.id ?? uninitializedUniverseId;

  const getChartResource = useCallback(() => {
    const isLoading = universeId === uninitializedUniverseId;
    return { id: universeId, type: ChartResourceType.Universe, isLoading };
  }, [universeId]);

  const value = useMemo(() => {
    return { getChartResource };
  }, [getChartResource]);

  return (
    <UniverseResourceContext.Provider value={value}>{children}</UniverseResourceContext.Provider>
  );
};
