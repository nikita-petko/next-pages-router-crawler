import type { FunctionComponent } from 'react';
import React from 'react';
import { UniverseAnnotationsClientProvider } from '@modules/charts-generic/context/annotations/UniverseAnnotationsClientProvider';
import ExperienceAnalyticsGameDetailsProvider from './ExperienceAnalyticsGameDetailsProvider';

const ExperienceAnalyticsPageContextProvider: FunctionComponent<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <ExperienceAnalyticsGameDetailsProvider>
      <UniverseAnnotationsClientProvider>{children}</UniverseAnnotationsClientProvider>
    </ExperienceAnalyticsGameDetailsProvider>
  );
};

export default ExperienceAnalyticsPageContextProvider;
