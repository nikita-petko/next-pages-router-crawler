import type { FC } from 'react';
import { useMemo, useRef } from 'react';
import { Grid } from '@rbx/ui';
import AssistantReportInsightCardV2 from '@modules/analytics-assistant/components/insights/AssistantReportInsightCardV2';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useComponentSize from '@modules/charts-generic/components/useComponentSize';
import type { NonEmptyArray } from '@modules/charts-generic/types/NonEmptyArray';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type { InsightCardSpec } from '@modules/experience-analytics-shared/types/insights';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import Section from '../../Section';
import InsightCardV2 from './InsightCardV2';
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
