import {
  RecommendedEventsLiveStatsClientWrapper,
  recommendedEventsLiveStatsClient,
} from '@modules/clients/analytics';
import React, { FunctionComponent, useContext } from 'react';

export type RecommendedEventsLiveStatsClient = {
  getLiveEvents: RecommendedEventsLiveStatsClientWrapper['getLiveEvents'];
};

export const RecommendedEventsLiveStatsClientContext =
  React.createContext<RecommendedEventsLiveStatsClient>(recommendedEventsLiveStatsClient);

export const useRecommendedEventsLiveStatsClient = (): RecommendedEventsLiveStatsClient => {
  const client = useContext(RecommendedEventsLiveStatsClientContext);
  if (client === null) {
    throw new Error(
      'useRecommendedEventsLiveStatsClient must be used within a RecommendedEventsLiveStatsClientContext',
    );
  }
  return client;
};

const RecommendedEventsLiveStatsClientProvider: FunctionComponent<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <RecommendedEventsLiveStatsClientContext.Provider value={recommendedEventsLiveStatsClient}>
      {children}
    </RecommendedEventsLiveStatsClientContext.Provider>
  );
};
export default RecommendedEventsLiveStatsClientProvider;
