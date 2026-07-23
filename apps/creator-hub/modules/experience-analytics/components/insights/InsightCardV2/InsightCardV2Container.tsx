import React, { FC, useMemo, useRef } from 'react';
import { Grid } from '@rbx/ui';
import { NonEmptyArray, useComponentSize } from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  InsightCardSpec,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
// eslint-disable-next-line no-restricted-imports -- Avoiding circular dependency by importing directly instead of from barrel file.
import AssistantReportInsightCardV2 from '@modules/analytics-assistant/components/insights/AssistantReportInsightCardV2';
import InsightCardV2 from './InsightCardV2';
import Section from '../../Section';
import useInsightVariant, {
  InsightVariant,
  isAssistantRecommendationsCompatibleSpec,
} from './useInsightsVariant';

const minCardWidth = 400;
const columnSpacing = 24;

const InsightCardV2Container: FC<{ insightCardSpecs: NonEmptyArray<InsightCardSpec> }> = ({
  insightCardSpecs,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const containerRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth } = useComponentSize(containerRef, 250);
  const insightVariant = useInsightVariant(insightCardSpecs);

  const numOfCardsPerRow = Math.min(
    insightCardSpecs.length,
    containerWidth < 2 * (minCardWidth + columnSpacing) ? 1 : 2,
  );

  const insightCards = useMemo(() => {
    switch (insightVariant) {
      case InsightVariant.InsightCards:
        return insightCardSpecs.map((spec) => (
          <Grid item key={spec.chartKey} XSmall={12 / numOfCardsPerRow}>
            <InsightCardV2 spec={spec} />
          </Grid>
        ));
      case InsightVariant.AssistantReportInsightCardV2: {
        const assistantReportCardSpec = insightCardSpecs.find(
          isAssistantRecommendationsCompatibleSpec,
        );

        if (!assistantReportCardSpec) {
          // NOTE(lucaswang, 2025-05-14): This should never happen since useInsightVariant
          // checks if there is at least one assistant report card spec.
          throw new Error('No assistant report card spec found');
        }

        return (
          <Grid item XSmall={12}>
            <AssistantReportInsightCardV2 spec={assistantReportCardSpec} />
          </Grid>
        );
      }
      default: {
        const exhaustiveCheck: never = insightVariant;
        throw new Error(`Unknown insight variant: ${exhaustiveCheck}`);
      }
    }
  }, [insightCardSpecs, insightVariant, numOfCardsPerRow]);

  return (
    <Section title={translate(translationKey('Title.Insights', TranslationNamespace.Insights))}>
      <Grid container direction='row' spacing={`${columnSpacing}px`} ref={containerRef}>
        {insightCards}
      </Grid>
    </Section>
  );
};

export default InsightCardV2Container;
