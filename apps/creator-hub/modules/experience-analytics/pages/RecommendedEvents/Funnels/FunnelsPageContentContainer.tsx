import RecommendedEventsLiveStatsClientProvider from '@modules/experience-analytics-shared/context/RecommendedEventsLiveStatsClientProvider';
import FunnelsPageContent from './FunnelsPageContent';

const FunnelsPageContentContainer = () => {
  return (
    <RecommendedEventsLiveStatsClientProvider>
      <FunnelsPageContent />
    </RecommendedEventsLiveStatsClientProvider>
  );
};
export default FunnelsPageContentContainer;
