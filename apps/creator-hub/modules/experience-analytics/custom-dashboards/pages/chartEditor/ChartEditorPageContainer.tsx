import type { FC, ReactNode } from 'react';
import gameUpdateNotificationsClient from '@modules/clients/gameUpdateNotifications';
import RecommendedEventsLiveStatsClientProvider from '@modules/experience-analytics-shared/context/RecommendedEventsLiveStatsClientProvider';
import {
  TextFilterProvider,
  type TextFilterFn,
} from '@modules/experience-analytics-shared/text-filter/TextFilterContext';

const filterTextThroughGameUpdateNotifications: TextFilterFn = async (text) => {
  const response = await gameUpdateNotificationsClient.filterGameUpdateText({ body: text });
  return { isFiltered: response.isFiltered === true };
};

type ChartEditorPageContainerProps = {
  readonly children: ReactNode;
};

/**
 * Provider stack for the chart editor. Controlled configurator state is local
 * to the shared hook; this container only supplies cross-cutting services the
 * controls need.
 */
const ChartEditorPageContainer: FC<ChartEditorPageContainerProps> = ({ children }) => (
  <TextFilterProvider filterText={filterTextThroughGameUpdateNotifications}>
    <RecommendedEventsLiveStatsClientProvider>{children}</RecommendedEventsLiveStatsClientProvider>
  </TextFilterProvider>
);

export default ChartEditorPageContainer;
