import React from 'react';
import { getUniverseAnalyticsTabLayout } from '@modules/experience-analytics-shared';
import EventsAnalyticsContainer from './EventsAnalyticsContainer';

const EventAnalyticsTabContent = () => {
  return getUniverseAnalyticsTabLayout(<EventsAnalyticsContainer />);
};

export default EventAnalyticsTabContent;
