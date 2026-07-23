import React from 'react';
import { UniversePerformanceRaqiClientProvider } from '@modules/experience-analytics-shared';
import PerformancePageContent from './PerformancePageContent';

const PerformancePageContentContainer = () => {
  return (
    <UniversePerformanceRaqiClientProvider>
      <PerformancePageContent />
    </UniversePerformanceRaqiClientProvider>
  );
};
export default PerformancePageContentContainer;
