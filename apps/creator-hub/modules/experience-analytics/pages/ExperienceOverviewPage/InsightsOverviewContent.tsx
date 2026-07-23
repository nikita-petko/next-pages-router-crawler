import React, { FC, useEffect, useMemo, useRef } from 'react';
import { Grid, useTheme } from '@rbx/ui';
import { isNonEmptyArray, useComponentSize } from '@modules/charts-generic';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  useGetMostRecentInsightsV2Specs,
  useUniverseResource,
} from '@modules/experience-analytics-shared';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { InsightTypeV2 } from '@modules/clients/analytics';
import InsightCardV2Container from '../../components/insights/InsightCardV2/InsightCardV2Container';
import AchievementCardContainer from '../../components/insights/InsightCardV2/AchievementCardContainer';
import Section from '../../components/Section';
import PerformanceRealtimeCard from './PerformanceRealtimeCard';
import SnapshotSection from './SnapshotSection';
import BenchmarkScoreCardsSection from './BenchmarkScoreCardsSection';
import { MetricAverageTypeProvider } from './MetricAverageTypeContext';

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
  const { translate } = useTranslationWrapper(useTranslation());
  const { id: universeId } = useUniverseResource();
  // We can't directly use media query here because of the left navigation drawer's presence in large screens.
  // Container query is also too new to use (https://caniuse.com/css-container-queries), so we observe content container's width
  // and decide whether to show secondary content on right side or not
  const contentContainerRef = useRef<HTMLDivElement | null>(null);
  const { width } = useComponentSize(contentContainerRef, 150);
  const showSecondaryContentOnRightSide = width > theme.breakpoints.values.Large;

  const { data } = useGetMostRecentInsightsV2Specs(universeId, insightTypes);

  const realtime = useMemo(
    () => (
      <Section title={translate(translationKey('Title.Realtime', TranslationNamespace.Insights))}>
        <PerformanceRealtimeCard />
      </Section>
    ),
    [translate],
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
          {isNonEmptyArray(data?.insightCardSpecs) ? (
            <Grid item XSmall={12}>
              <InsightCardV2Container insightCardSpecs={data.insightCardSpecs} />
            </Grid>
          ) : null}
          <Grid item XSmall={12}>
            <BenchmarkScoreCardsSection />
          </Grid>
          {!showSecondaryContentOnRightSide && (
            <React.Fragment>
              <Grid item XSmall={12}>
                {realtime}
              </Grid>
              {achievements && (
                <Grid item XSmall={12}>
                  {achievements}
                </Grid>
              )}
            </React.Fragment>
          )}
          <Grid item XSmall={12}>
            <SnapshotSection />
          </Grid>
        </Grid>
        {showSecondaryContentOnRightSide && (
          <Grid item style={{ flex: `0 0 ${rightPanelWidth}px` }}>
            <Grid container gap={`${spacingBetweenSections}px`}>
              {realtime}
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
]);
