import React, { useMemo } from 'react';
import { DateRangeType, useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic';
import { InsightTypeV2 } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withNamespaceSwitchedTranslation } from '@modules/analytics-translations';
import {
  useGetMostRecentInsightsV2Specs,
  useUniverseResource,
} from '@modules/experience-analytics-shared';
import PlayerFeedbackSummaryInsightCard from './PlayerFeedbackSummaryInsightCard';

const PlayerFeedbackSummaryContainer = () => {
  const { rangeType } = useAnalyticsCurrentDateRangeBundle();
  const { id: universeId } = useUniverseResource();

  const insightType = useMemo(() => {
    if (rangeType === DateRangeType.Last28Days) {
      return InsightTypeV2.PlayerFeedbackReport28Days;
    }
    return InsightTypeV2.PlayerFeedbackReport7Days;
  }, [rangeType]);
  const specs = useGetMostRecentInsightsV2Specs(universeId, [insightType]);

  if (specs.data?.insightCardSpecs[0]?.type !== insightType) {
    return null;
  }

  if (rangeType !== DateRangeType.Last28Days && rangeType !== DateRangeType.Last7Days) {
    return null;
  }

  if (specs.data?.insightCardSpecs.length === 0 || !specs.data?.insightCardSpecs[0]) {
    return null;
  }

  return (
    <PlayerFeedbackSummaryInsightCard
      id={specs.data?.insightCardSpecs[0].insightId ?? ''}
      universeId={universeId}
      reportSummary={specs.data?.insightCardSpecs[0].reportSummary}
      reportType={insightType}
    />
  );
};

export default withNamespaceSwitchedTranslation(PlayerFeedbackSummaryContainer, [
  TranslationNamespace.PlayerFeedback,
  TranslationNamespace.Analytics,
  TranslationNamespace.AnalyticsAssistant,
]);
