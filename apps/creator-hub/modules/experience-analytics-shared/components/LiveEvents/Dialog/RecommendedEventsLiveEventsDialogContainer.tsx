import React, { FC } from 'react';
import RecommendedEventsLiveEventsHasEventsApiDataContextProvider from '../../../context/dataProviders/RecommendedEventsLiveEventsHasEventsApiDataProvider';
import RecommendedEventsLiveEventsApiDataContextProvider from '../../../context/dataProviders/RecommendedEventsLiveEventsApiDataProvider';
import RecommendedEventsLiveEventsDialog, {
  RecommendedEventsLiveEventsDialogProps,
} from './RecommendedEventsLiveEventsTableDialog';

const RecommendedEventsLiveEventsDialogContainer: FC<RecommendedEventsLiveEventsDialogProps> = (
  props,
) => {
  const { defaultEventType } = props;
  return (
    <RecommendedEventsLiveEventsHasEventsApiDataContextProvider>
      <RecommendedEventsLiveEventsApiDataContextProvider defaultEventType={defaultEventType}>
        <RecommendedEventsLiveEventsDialog {...props} />
      </RecommendedEventsLiveEventsApiDataContextProvider>
    </RecommendedEventsLiveEventsHasEventsApiDataContextProvider>
  );
};

export default RecommendedEventsLiveEventsDialogContainer;
