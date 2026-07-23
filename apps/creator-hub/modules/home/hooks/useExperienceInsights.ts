import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { InsightTypeV2 } from '@modules/experience-analytics-shared';
import { getInsightsRequest } from '@modules/react-query/universeAnalyticsInsights/universeAnalyticsInsightsRequest';
import { UniverseAnalyticsInsightsQueryKeys } from '@modules/react-query/universeAnalyticsInsights/useUniverseAnalyticsInsightsQueries';
import { TExperienceAnalytics } from '../providers/getExperienceAnalytics';

const InsightReportMaxLength = 120;
const InsightTypes = [InsightTypeV2.SummaryReport, InsightTypeV2.SummaryReport7Days];
const DAU_THRESHOLD = 1000;
// Insights don't change frequently; avoid refetching on window focus or component remount.
const STALE_TIME_MS = 5 * 60 * 1000;

export type TExperienceInsight = {
  summary: string;
  insightId: string;
};

type ExperienceAnalyticsMap = Readonly<Record<number, TExperienceAnalytics | null> | null>;

function parseInsight(
  insightsList: Awaited<ReturnType<typeof getInsightsRequest>>,
): TExperienceInsight | null {
  const summaryInsight = insightsList.find(
    (insight) =>
      insight.insightType === InsightTypeV2.SummaryReport ||
      insight.insightType === InsightTypeV2.SummaryReport7Days,
  );
  if (!summaryInsight) return null;

  const { summaryReportEvidence, id: insightId } = summaryInsight;
  const { sections } = summaryReportEvidence?.report ?? {};
  if (!sections || sections.length === 0) return null;

  const { content } = sections[0];
  if (!content) return null;

  const lines = content.split('\n').filter((line: string) => line.trim());
  const firstBullet = lines[0]?.replace(/^[\s\-•*]+/, '').trim();
  if (!firstBullet) return null;

  const summary =
    firstBullet.length > InsightReportMaxLength
      ? `${firstBullet.slice(0, InsightReportMaxLength)}...`
      : firstBullet;

  return { summary, insightId };
}

const useExperienceInsights = (
  experiencesAnalytics: ExperienceAnalyticsMap,
): Record<number, TExperienceInsight | null> | null => {
  const qualifyingIds = useMemo(() => {
    if (!experiencesAnalytics) return [];
    return Object.entries(experiencesAnalytics)
      .filter(([, analytics]) => (analytics?.dailyActiveUser?.newValue ?? 0) >= DAU_THRESHOLD)
      .map(([id]) => Number(id));
  }, [experiencesAnalytics]);

  const queries = useQueries({
    queries: qualifyingIds.map((universeId) => ({
      queryKey: [UniverseAnalyticsInsightsQueryKeys.GetInsights, universeId, ...InsightTypes],
      queryFn: () => getInsightsRequest(universeId, InsightTypes),
      staleTime: STALE_TIME_MS,
      retry: false,
    })),
  });

  return useMemo(() => {
    if (!experiencesAnalytics || qualifyingIds.length === 0) return null;

    const result: Record<number, TExperienceInsight | null> = {};
    qualifyingIds.forEach((universeId, index) => {
      const query = queries[index];
      if (query.isError) {
        result[universeId] = null;
      } else if (query.data) {
        result[universeId] = parseInsight(query.data);
      }
    });

    return Object.keys(result).length > 0 ? result : null;
  }, [experiencesAnalytics, qualifyingIds, queries]);
};

export default useExperienceInsights;
