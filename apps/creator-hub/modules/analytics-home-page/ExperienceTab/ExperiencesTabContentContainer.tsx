import type { FunctionComponent } from 'react';
import { WatchlistType } from '@rbx/client-analytics-watchlists/v1';
import AnalyticsWatchlistProvider from '@modules/experience-analytics-shared/context/AnalyticsWatchlistProvider';
import type { ExperiencesTabContentSpec } from './ExperiencesTabContent';
import ExperiencesTabContent from './ExperiencesTabContent';

const ExperiencesTabContentContainer: FunctionComponent<ExperiencesTabContentSpec> = (props) => {
  return (
    <AnalyticsWatchlistProvider watchlistType={WatchlistType.Experiences}>
      <ExperiencesTabContent {...props} />
    </AnalyticsWatchlistProvider>
  );
};

export default ExperiencesTabContentContainer;
