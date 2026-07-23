import { FC, PropsWithChildren, ReactNode } from 'react';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import ExperienceAnalyticsPageContextProvider from '../context/ExperienceAnalyticsPageContextProvider';
import { UniverseResourceProvider } from '../context/resourceContexts/UniverseResourceProvider';
import { SharedAnalyticsPageProviders } from './getSharedAnalyticsWrapper';
import { AnalyticsContextLayerOuterProvider } from '../context/AnalyticsContextLayerProvider';
import { BreakdownColorConsistencyProvider } from '../context/BreakdownColorConsistencyContext';

export const UniverseAnalyticsTabLayoutProviders: FC<PropsWithChildren> = ({ children }) => {
  const { gameDetails } = useCurrentGame();
  const universeId = gameDetails?.id;

  return (
    <SharedAnalyticsPageProviders universeId={universeId}>
      <AnalyticsContextLayerOuterProvider>
        <BreakdownColorConsistencyProvider>
          <UniverseResourceProvider>
            <ExperienceAnalyticsPageContextProvider>
              {children}
            </ExperienceAnalyticsPageContextProvider>
          </UniverseResourceProvider>
        </BreakdownColorConsistencyProvider>
      </AnalyticsContextLayerOuterProvider>
    </SharedAnalyticsPageProviders>
  );
};

export default function getUniverseAnalyticsTabLayout(page: NonNullable<ReactNode>) {
  return <UniverseAnalyticsTabLayoutProviders>{page}</UniverseAnalyticsTabLayoutProviders>;
}
