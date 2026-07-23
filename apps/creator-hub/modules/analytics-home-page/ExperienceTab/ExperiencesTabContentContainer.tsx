import React, { FunctionComponent } from 'react';
import { AnalyticsWatchlistProvider } from '@modules/experience-analytics-shared';
import { WatchlistType } from '@rbx/clients/analyticsWatchlists';
import ExperiencesTabContent, { ExperiencesTabContentSpec } from './ExperiencesTabContent';

const ExperiencesTabContentContainer: FunctionComponent<ExperiencesTabContentSpec> = (props) => {
  return (
    <AnalyticsWatchlistProvider watchlistType={WatchlistType.Experiences}>
      <ExperiencesTabContent {...props} />
    </AnalyticsWatchlistProvider>
  );
};

export default ExperiencesTabContentContainer;
