import React, { useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Typography, Chip } from '@rbx/ui';
import {
  analyticsAssistantNavigationItem,
  AnalyticsQueryParams,
  buildExperienceAnalyticsUrlWithParams,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { InsightTypeV2 } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  GenericSummaryInsightCard,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';

type PlayerFeedbackSummaryInsightCardProps = {
  id: string;
  universeId: number;
  reportSummary: string;
  reportType: InsightTypeV2;
};

const PlayerFeedbackSummaryInsightCard = ({
  id,
  universeId,
  reportSummary,
  reportType,
}: PlayerFeedbackSummaryInsightCardProps) => {
  const router = useRouter();
  const { translate } = useRAQIV2TranslationDependencies();

  const exploreLink = useMemo(() => {
    return buildExperienceAnalyticsUrlWithParams(
      analyticsAssistantNavigationItem,
      {
        [AnalyticsQueryParams.InsightId]: id,
      },
      universeId,
    );
  }, [id, universeId]);

  const handleClick = useCallback(() => {
    router.push(exploreLink);
  }, [router, exploreLink]);

  const betaChip = useMemo(
    () => (
      <Chip
        label={translate(translationKey('Label.Beta', TranslationNamespace.AnalyticsAssistant))}
        color='secondary'
        size='small'
      />
    ),
    [translate],
  );

  return (
    <GenericSummaryInsightCard
      header={{
        text: translate(translationKey('Heading.Assistant', TranslationNamespace.Analytics)),
        adornment: betaChip,
      }}
      body={{
        content: <Typography variant='body1'>{reportSummary.replace(/^\n+/, '')}</Typography>,
      }}
      primaryAction={{
        label: translate(
          translationKey('Action.DeepDiveWithAssistant', TranslationNamespace.PlayerFeedback),
        ),
        onClick: handleClick,
      }}
      disclaimer={translate(
        translationKey(
          'Label.PlayerFeedbackCard.Disclaimer',
          TranslationNamespace.AnalyticsAssistant,
        ),
      )}
      logging={{
        impressionEventName: 'analytics/assistant/recommendationCardImpression',
        clickEventName: 'analytics/assistant/recommendationCardInsightPrimaryCTA',
        parameters: {
          universe_id: universeId.toString(),
          insight_type: reportType,
          insight_id: id,
        },
      }}
    />
  );
};

export default PlayerFeedbackSummaryInsightCard;
