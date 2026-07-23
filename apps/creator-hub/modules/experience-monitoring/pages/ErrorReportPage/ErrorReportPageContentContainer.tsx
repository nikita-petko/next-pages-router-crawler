import React, { FunctionComponent } from 'react';
import { UniversePerformanceRaqiClientProvider } from '@modules/experience-analytics-shared';
import ErrorReportPageContent from './ErrorReportPageContent';

const ErrorReportPageContentContainer: FunctionComponent = () => {
  return (
    <UniversePerformanceRaqiClientProvider>
      <ErrorReportPageContent />
    </UniversePerformanceRaqiClientProvider>
  );
};

export default ErrorReportPageContentContainer;
