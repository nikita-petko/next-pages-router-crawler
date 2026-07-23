import type { FC } from 'react';
import React, { useEffect, useMemo, useRef } from 'react';
import { useFlag } from '@rbx/flags';
import { withTranslation } from '@rbx/intl';
import { Grid, useTheme } from '@rbx/ui';
import { isExperienceAlertsEnabled } from '@generated/flags/creatorAnalytics';
import useComponentSize from '@modules/charts-generic/components/useComponentSize';
import { isNonEmptyArray } from '@modules/charts-generic/types/NonEmptyArray';
import { InsightTypeV2 } from '@modules/clients/analytics';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { useGetMostRecentInsightsV2Specs } from '@modules/experience-analytics-shared/hooks/useGetInsightsV2Specs';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import AchievementCardContainer from '../../components/insights/InsightCardV2/AchievementCardContainer';
import InsightCardV2Container from '../../components/insights/InsightCardV2/InsightCardV2Container';
import BenchmarkScoreCardsSection from './BenchmarkScoreCardsSection';
import { MetricAverageTypeProvider } from './MetricAverageTypeContext';
import OverviewAlertsCard from './OverviewAlertsCard/OverviewAlertsCard';
import PerformanceRealtimeCard from './PerformanceRealtimeCard';
import SnapshotSection from './SnapshotSection';

const spacingBetweenSections = 32;
const spacingBetweenPanel = 32;
const rightPanelWidth = 314;

const insightTypes: InsightTypeV2[] = [
  InsightTypeV2.PercentChange,
  InsightTypeV2.PeriodHigh,
  InsightTypeV2.LowEndAndroidCrashRate,
  InsightTypeV2.SummaryReport,
  InsightTypeV2.SummaryReport7Days,
  InsightTypeV2.AdsPerformance7Days,
];

const InsightsOverviewContent: FC = () => {
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const theme = useTheme();
  const { id: universeId } = useUniverseResource();
  const { value: isExperienceAlertsEnabledFlag } = useFlag(isExperienceAlertsEnabled, {
    universeId,
  });
  // Alerts must additionally be hidden from collaborators who don't have
  // analytics-view permission on this universe, since the underlying
  // metric/dimension queries would otherwise return 403.
  const { userCanViewAnalyticsForUniverse } = useAnalyticsExperiencePermissions(universeId);
  // We can't directly use media query here because of the left navigation drawer's presence in large screens.
  // Container query is also too new to use (https://caniuse.com/css-container-queries), so we observe content container's width
  // and decide whether to show secondary content on right side or not
  const contentContainerRef = useRef<HTMLDivElement | null>(null);
  const { width } = useComponentSize(contentContainerRef, 150);
  const showSecondaryContentOnRightSide = width > theme.breakpoints.values.Large;

  const { data } = useGetMostRecentInsightsV2Specs(universeId, insightTypes);

  const alerts = useMemo(
    () =>
      isExperienceAlertsEnabledFlag && userCanViewAnalyticsForUniverse ? (
        <OverviewAlertsCard />
      ) : null,
    [isExperienceAlertsEnabledFlag, userCanViewAnalyticsForUniverse],
  );

  const achievements = useMemo(
    () =>
      isNonEmptyArray(data?.achievementSpecs) ? (
        <AchievementCardContainer achievementCardSpecs={data.achievementSpecs} />
      ) : null,
    [data],
  );

  useEffect(() => {
    unifiedLogger.logImpressionEvent({
      eventName: 'analytics/overview/insightsV2PageLoadImpression',
      parameters: {
        universe_id: `${universeId}`,
      },
    });
  }, [unifiedLogger, universeId]);

  return (
    <MetricAverageTypeProvider>
      <Grid
        ref={contentContainerRef}
        container
        item
        gap={`${spacingBetweenPanel}px`}
        style={{ flexWrap: 'nowrap' }}>
        <Grid
          container
          item
          gap={`${spacingBetweenSections}px`}
          style={{ flex: 1, minWidth: 0, width: 'auto' }}>
          {!showSecondaryContentOnRightSide && alerts && (
            <Grid item XSmall={12}>
              {alerts}
            </Grid>
          )}
          {!showSecondaryContentOnRightSide && (
            <Grid item XSmall={12}>
              <PerformanceRealtimeCard />
            </Grid>
          )}
          {isNonEmptyArray(data?.insightCardSpecs) ? (
            <Grid item XSmall={12}>
              <InsightCardV2Container insightCardSpecs={data.insightCardSpecs} />
            </Grid>
          ) : null}
          <Grid item XSmall={12}>
            <BenchmarkScoreCardsSection />
          </Grid>
          {!showSecondaryContentOnRightSide && achievements && (
            <Grid item XSmall={12}>
              {achievements}
            </Grid>
          )}
          <Grid item XSmall={12}>
            <SnapshotSection />
          </Grid>
        </Grid>
        {showSecondaryContentOnRightSide && (
          <Grid item style={{ flex: `0 0 ${rightPanelWidth}px` }}>
            <Grid container gap={`${spacingBetweenSections}px`}>
              {alerts}
              <PerformanceRealtimeCard />
              {achievements}
            </Grid>
          </Grid>
        )}
      </Grid>
    </MetricAverageTypeProvider>
  );
};

export default withTranslation(InsightsOverviewContent, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Insights,
  TranslationNamespace.Navigation,
  TranslationNamespace.Genres,
  TranslationNamespace.ExperienceAlerts,
]);
