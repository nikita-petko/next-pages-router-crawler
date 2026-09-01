import getUniverseAnalyticsTabLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsTabLayout';
import EventsAnalyticsContainer from './EventsAnalyticsContainer';

const EventAnalyticsTabContent = () => {
  return getUniverseAnalyticsTabLayout(<EventsAnalyticsContainer />);
};

export default EventAnalyticsTabContent;
