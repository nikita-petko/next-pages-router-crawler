import React from 'react';
import { RecommendedEventsLiveStatsClientProvider } from '@modules/experience-analytics-shared';
import FunnelsPageContent from './FunnelsPageContent';

const FunnelsPageContentContainer = () => {
  return (
    <RecommendedEventsLiveStatsClientProvider>
      <FunnelsPageContent />
    </RecommendedEventsLiveStatsClientProvider>
  );
};
export default FunnelsPageContentContainer;
