import RecommendedEventsLiveStatsClientProvider from '@modules/experience-analytics-shared/context/RecommendedEventsLiveStatsClientProvider';
import EconomyPageContent from './EconomyPageContent';

const EconomyPageContentContainer = () => {
  return (
    <RecommendedEventsLiveStatsClientProvider>
      <EconomyPageContent />
    </RecommendedEventsLiveStatsClientProvider>
  );
};
export default EconomyPageContentContainer;
