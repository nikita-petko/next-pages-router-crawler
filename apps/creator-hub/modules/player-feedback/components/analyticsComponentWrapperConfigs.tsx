import React from 'react';
import {
  AnalyticsComponentType,
  ArbitraryComponentConfig,
  GenericAnalyticsLayoutItem,
  RAQIV2SpecialLayoutType,
} from '@modules/experience-analytics-shared';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import PlayerFeedbackTableContainer from './PlayerFeedbackTable/PlayerFeedbackTableContainer';
import PlayerFeedbackVoteChart from './PlayerFeedbackVoteChart';
import PlayerFeedbackSummaryContainer from './PlayerFeedbackSummary/PlayerFeedbackSummaryContainer';

export const analyticsComponentConfigPlayerFeedbackTable = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'isolated',
    render: () => {
      return <PlayerFeedbackTableContainer />;
    },
  },
} as const satisfies ArbitraryComponentConfig;

export const analyticsComponentConfigPlayerFeedbackSummary = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'isolated',
    render: () => {
      return <PlayerFeedbackSummaryContainer />;
    },
  },
} as const satisfies ArbitraryComponentConfig;

export const analyticsComponentConfigPlayerFeedbackVotesCountChart = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [RAQIV2Metric.PlayerFeedbackVotesCount],
  renderer: {
    type: 'withChartContext',
    render: (chartContext, onSelectChartRegion) => {
      return (
        <GenericAnalyticsLayoutItem layout={RAQIV2SpecialLayoutType.FullWidthLayout}>
          <PlayerFeedbackVoteChart
            universeId={chartContext.resource.id}
            startDate={chartContext.timeSpec.startTime}
            endDate={chartContext.timeSpec.endTime}
            onSelectChartRegion={onSelectChartRegion}
          />
        </GenericAnalyticsLayoutItem>
      );
    },
  },
} as const satisfies ArbitraryComponentConfig;
