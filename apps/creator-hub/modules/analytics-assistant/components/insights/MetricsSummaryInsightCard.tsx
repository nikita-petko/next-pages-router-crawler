import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';
import type { Report } from '@rbx/client-universe-analytics-insights/v1';
import { withTranslation } from '@rbx/intl';
import { Chip } from '@rbx/ui';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsAssistantNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import buildExperienceAnalyticsUrlWithParams from '@modules/charts-generic/utils/analyticsUrlBuilder';
import GenericSummaryInsightCard from '@modules/experience-analytics-shared/components/GenericSummaryInsightCard/GenericSummaryInsightCard';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { InsightTypeV2 } from '@modules/experience-analytics-shared/types/insights';
import { logAnalyticsClickEvent } from '@modules/experience-analytics-shared/utils/analyticsEventLogger';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSnoozeInsight } from '@modules/react-query/universeAnalyticsInsights';
import MDX from '../markdown/MDX';

const SNOOZE_DURATION = 14;

type MetricsSummaryInsightCardProps = {
  debugPageName: string;
  title: TranslationKey;
  insightId: string;
  report: Report;
  snoozeKey: string;
};

const MetricsSummaryInsightCard = ({
  debugPageName,
  title,
  insightId,
  report,
  snoozeKey,
}: MetricsSummaryInsightCardProps) => {
  const router = useRouter();
  const { id: universeId } = useUniverseResource();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { translate } = useRAQIV2TranslationDependencies();
  const { mutate: snoozeInsight } = useSnoozeInsight(
    universeId,
    InsightTypeV2.MetricsSummary,
    snoozeKey,
  );

  const dashboardName = useMemo(() => {
    return translate(title);
  }, [translate, title]);

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

  const firstSectionContent = useMemo(() => {
    const content = report.sections?.[0]?.content;
    if (!content) {
      return undefined;
    }

    return content;
  }, [report.sections]);
  const currentPage = router.pathname;

  const exploreLink = useMemo(() => {
    return buildExperienceAnalyticsUrlWithParams(
      analyticsAssistantNavigationItem,
      {
        [AnalyticsQueryParams.InsightId]: insightId,
      },
      universeId,
    );
  }, [insightId, universeId]);

  const handleClick = useCallback(() => {
    logAnalyticsClickEvent(unifiedLogger, 'analytics/dashboardInsight/click', {
      universe_id: universeId.toString(),
      insight_type: InsightTypeV2.MetricsSummary,
      insight_id: insightId,
      page: currentPage,
      page_key: debugPageName,
    });
    router.push(exploreLink);
  }, [unifiedLogger, universeId, insightId, currentPage, debugPageName, router, exploreLink]);

  const handleSnooze = useCallback(() => {
    snoozeInsight();
    logAnalyticsClickEvent(unifiedLogger, 'analytics/dashboardInsight/snooze', {
      universe_id: universeId.toString(),
      insight_type: InsightTypeV2.MetricsSummary,
      insight_id: insightId,
      page: currentPage,
      page_key: debugPageName,
    });
  }, [snoozeInsight, unifiedLogger, universeId, insightId, currentPage, debugPageName]);

  const snoozeActionLabel = useMemo(() => {
    return translate(translationKey('Action.SnoozeV2', TranslationNamespace.Insights), {
      value: SNOOZE_DURATION.toLocaleString(),
    });
  }, [translate]);

  // Early return if no sections or no content in first section
  if (!firstSectionContent) {
    return null;
  }

  return (
    <GenericSummaryInsightCard
      header={{
        text: translate(
          translationKey('Heading.DashboardInsights', TranslationNamespace.AnalyticsAssistant),
          { dashboard: dashboardName },
        ),
        adornment: betaChip,
      }}
      body={{
        content: (
          <div style={{ maxHeight: '7em', overflow: 'hidden' }}>
            <MDX content={firstSectionContent} />
          </div>
        ),
        enableFade: true,
      }}
      primaryAction={{
        label: translate(
          translationKey('Action.SeeDashboardReport', TranslationNamespace.AnalyticsAssistant),
          { dashboard: dashboardName.toLocaleLowerCase() },
        ),
        onClick: handleClick,
      }}
      disclaimer={translate(
        translationKey(
          'Label.SummaryReportInsightCard.Disclaimer',
          TranslationNamespace.AnalyticsAssistant,
        ),
      )}
      logging={{
        impressionEventName: 'analytics/dashboardInsight/impression',
        clickEventName: 'analytics/dashboardInsight/click',
        parameters: {
          universe_id: universeId.toString(),
          insight_type: InsightTypeV2.MetricsSummary,
          insight_id: insightId,
          page: currentPage,
          page_key: debugPageName,
        },
      }}
      snoozeAction={{
        label: snoozeActionLabel,
        onSnooze: handleSnooze,
      }}
    />
  );
};

export default withTranslation(MetricsSummaryInsightCard, [
  TranslationNamespace.Analytics,
  TranslationNamespace.AnalyticsAssistant,
  TranslationNamespace.Navigation,
  TranslationNamespace.Insights,
]);
