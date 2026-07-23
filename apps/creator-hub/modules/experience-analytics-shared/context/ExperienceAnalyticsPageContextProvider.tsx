import React, { FunctionComponent } from 'react';
import { UniverseAnnotationsClientProvider } from '@modules/charts-generic';
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
