import type { FC, PropsWithChildren, ReactNode } from 'react';
import { AnalyticsContextLayerOuterProvider } from '../context/AnalyticsContextLayerProvider';
import { BreakdownColorConsistencyProvider } from '../context/BreakdownColorConsistencyContext';
import ExperienceAnalyticsPageContextProvider from '../context/ExperienceAnalyticsPageContextProvider';
import { UniverseResourceProvider } from '../context/resourceContexts/UniverseResourceProvider';
import { SharedAnalyticsPageProviders } from './getSharedAnalyticsWrapper';

export const UniverseAnalyticsTabLayoutProviders: FC<PropsWithChildren> = ({ children }) => {
  return (
    <SharedAnalyticsPageProviders>
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
