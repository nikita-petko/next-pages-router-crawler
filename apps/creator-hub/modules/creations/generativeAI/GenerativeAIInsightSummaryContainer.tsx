import type { FunctionComponent } from 'react';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { InsightTypeV2 } from '@modules/clients/analytics';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useGetMostRecentInsights } from '@modules/react-query/universeAnalyticsInsights/useUniverseAnalyticsInsightsQueries';
import GenerativeAIInsightCard from './GenerativeAIInsightCard';

const GenerativeAIInsightSummaryContainer: FunctionComponent = () => {
  const { id: universeId } = useUniverseResource();
  const { data: insights } = useGetMostRecentInsights(universeId, [
    InsightTypeV2.PromptCategoriesSummary,
  ]);

  const insight = insights?.[0];
  const content = insight?.summaryReportEvidence?.report?.sections?.[0]?.content;

  if (!content) {
    return null;
  }

  return <GenerativeAIInsightCard reportSummary={content} />;
};

export default withNamespaceSwitchedTranslation(GenerativeAIInsightSummaryContainer, [
  TranslationNamespace.Analytics,
  TranslationNamespace.AnalyticsAssistant,
  TranslationNamespace.PlayerFeedback,
]);
