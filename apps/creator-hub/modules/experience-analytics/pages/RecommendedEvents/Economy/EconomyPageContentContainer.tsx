import React from 'react';
import { RecommendedEventsLiveStatsClientProvider } from '@modules/experience-analytics-shared';
import EconomyPageContent from './EconomyPageContent';

const EconomyPageContentContainer = () => {
  return (
    <RecommendedEventsLiveStatsClientProvider>
      <EconomyPageContent />
    </RecommendedEventsLiveStatsClientProvider>
  );
};
export default EconomyPageContentContainer;
