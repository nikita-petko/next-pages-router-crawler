import type { FC, ReactNode } from 'react';
import RecommendedEventsLiveStatsClientProvider from '@modules/experience-analytics-shared/context/RecommendedEventsLiveStatsClientProvider';

type ChartEditorPageContainerProps = {
  readonly children: ReactNode;
};

/**
 * Provider stack for the chart editor. Controlled configurator state is local
 * to the shared hook; this container only supplies cross-cutting services the
 * controls need.
 */
const ChartEditorPageContainer: FC<ChartEditorPageContainerProps> = ({ children }) => (
  <RecommendedEventsLiveStatsClientProvider>{children}</RecommendedEventsLiveStatsClientProvider>
);

export default ChartEditorPageContainer;
