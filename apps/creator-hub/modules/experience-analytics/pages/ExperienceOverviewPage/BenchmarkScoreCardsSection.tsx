import type { FC, ReactNode } from 'react';
import React, { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQueries } from '@tanstack/react-query';
import { BenchmarkType } from '@rbx/client-universe-analytics-insights/v1';
import { StatusCodes } from '@rbx/core';
import { RAQIV2DateRangeType, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { useFlag } from '@rbx/flags';
import {
  Button,
  Collapse,
  ExpandLessIcon,
  ExpandMoreIcon,
  Grid,
  Link,
  Skeleton,
  Typography,
} from '@rbx/ui';
import { isHomeAcquisitionSignalsEnabled } from '@generated/flags/gameDiscoveryServing';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useComponentSize from '@modules/charts-generic/components/useComponentSize';
import { analyticsExploreNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import useLocale from '@modules/charts-generic/context/useLocale';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import buildExperienceAnalyticsUrlWithParams from '@modules/charts-generic/utils/analyticsUrlBuilder';
import type { BenchmarkScorecardData } from '@modules/clients/analytics';
import { AnnotationType } from '@modules/clients/analytics';
import { getResponseFromError } from '@modules/clients/utils';
import BenchmarkScoreCard from '@modules/experience-analytics-shared/components/BenchmarkScoreCard/BenchmarkScoreCard';
import { AnnotationSelectableCategory as AnnotationCategory } from '@modules/experience-analytics-shared/constants/annotationConfig';
import {
  BenchmarkGenre,
  benchmarkGenreToTranslationKey,
} from '@modules/experience-analytics-shared/constants/BenchmarkGenre';
import {
  chartConfigAverageRevenuePerPayingUser,
  chartConfigConversionRate,
  chartConfigEngagementAveragePlayTimePerDAU,
  chartConfigForwardD1Retention,
  chartConfigForwardD7Retention,
  chartConfigL7AverageForwardD1Retention,
  chartConfigL7AverageForwardD7Retention,
  chartConfigL7AveragePayingUsersCVR,
  chartConfigL7AveragePlayTimePerDAU,
  chartConfigL7AverageRevenuePerPayingUser,
  chartConfigL7AverageRFYPTR,
  chartConfigL7AverageRFYQualifiedPTR,
  chartConfigRFYPlayThroughRate,
  chartConfigRFYQualifiedPTR,
} from '@modules/experience-analytics-shared/constants/chart-configs/PredefinedChartConfigLiterals';
import {
  OnboardingFeatureKey,
  OnboardingStepKey,
} from '@modules/experience-analytics-shared/constants/onboardingTipsConfigs';
import type { ChartConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import { getFirstMetricFromPredefinedChart } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import { useUniverseAnalyticsInsightsClient } from '@modules/experience-analytics-shared/context/UniverseAnalyticsInsightsClientProvider';
import getExploreModeUrlParams from '@modules/experience-analytics-shared/exploreMode/getExploreModeUrlParams';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import getUniqueKeyForAnalyticsComponent from '@modules/experience-analytics-shared/utils/getUniqueKeyForAnalyticsComponent';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { getBenchmarkTypeDisplayName } from '../../adapters/utils';
import Section from '../../components/Section';
import BenchmarkTypeDropdown from './BenchmarkTypeDropdown';
import {
  logClickBenchmarkScoreCard,
  logClickViewAllBenchmarks,
  logClickViewRFYSignals,
} from './logger';
import { MetricAverageType, useMetricAverageType } from './MetricAverageTypeContext';
import MetricAverageTypeDropdown from './MetricAverageTypeDropdown';

const columns = 60;
const minCardWidth = 280; // match with benchmark score card minimum width. see BenchmarkScoreCard.styles.ts
const rowSpacing = 16;
const columnSpacing = 16;

const scoreCardEventLogging = {
  comparisonChipHoverEventName: 'analytics/overview/hoverBenchmarkComparisonChip',
  suggestionHoverEventName: 'analytics/overview/hoverBenchmarkSuggestion',
  impressionEventName: 'analytics/overview/benchmarkScorecardImpression',
};

const l7ChartConfigsBase = [
  chartConfigL7AveragePlayTimePerDAU,
  chartConfigL7AverageForwardD1Retention,
  chartConfigL7AverageForwardD7Retention,
  chartConfigL7AveragePayingUsersCVR,
  chartConfigL7AverageRevenuePerPayingUser,
] as const satisfies readonly ChartConfig[];

const l7ChartConfigs = [
  ...l7ChartConfigsBase,
  chartConfigL7AverageRFYQualifiedPTR,
] as const satisfies readonly ChartConfig[];

const l7ChartConfigsWithRFYPTR = [
  ...l7ChartConfigsBase,
  chartConfigL7AverageRFYPTR,
] as const satisfies readonly ChartConfig[];

const regularChartConfigsBase = [
  chartConfigEngagementAveragePlayTimePerDAU,
  chartConfigForwardD1Retention,
  chartConfigForwardD7Retention,
  chartConfigConversionRate,
  chartConfigAverageRevenuePerPayingUser,
] as const satisfies readonly ChartConfig[];
const regularChartConfigs = [
  ...regularChartConfigsBase,
  chartConfigRFYQualifiedPTR,
] as const satisfies readonly ChartConfig[];
const regularChartConfigsWithRFYPTR = [
  ...regularChartConfigsBase,
  chartConfigRFYPlayThroughRate,
] as const satisfies readonly ChartConfig[];

const BenchmarkScoreCardsSection: FC = () => {
  const { id: universeId, isLoading: isUniverseLoading } = useUniverseResource();
  const { value: isHomeAcquisitionSignalsEnabledValue } = useFlag(isHomeAcquisitionSignalsEnabled, {
    universeId,
  });
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { translate, translateHTML } = useRAQIV2TranslationDependencies();
  const locale = useLocale();
  const router = useRouter();
  const { metricAverageType } = useMetricAverageType();

  const useL7Metrics = metricAverageType === MetricAverageType.L7Average;

  let chartConfigs: readonly ChartConfig[] = isHomeAcquisitionSignalsEnabledValue
    ? regularChartConfigsWithRFYPTR
    : regularChartConfigs;
  if (useL7Metrics) {
    chartConfigs = isHomeAcquisitionSignalsEnabledValue ? l7ChartConfigsWithRFYPTR : l7ChartConfigs;
  }

  // State for benchmark type selection
  const [selectedBenchmarkType, setSelectedBenchmarkType] = useState<BenchmarkType | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const { width: containerSize } = useComponentSize(containerRef);

  const numOfCardsPerRow = Math.min(
    chartConfigs.length,
    Math.floor(containerSize / (minCardWidth + columnSpacing)),
  );

  const universeInsightsClient = useUniverseAnalyticsInsightsClient();

  const retry = useCallback((failureCount: number, error: Error) => {
    return failureCount < 3 && getResponseFromError(error)?.status !== StatusCodes.FORBIDDEN;
  }, []);

  const combine = useCallback(
    (result: UseQueryResult<BenchmarkScorecardData>[]) => {
      // Set initial selected benchmark type if not set and switching is enabled
      if (selectedBenchmarkType === null && result[0]?.data?.recommendedType) {
        setSelectedBenchmarkType(result[0].data.recommendedType);
      }

      return {
        scorecardsResult: result.map(({ data, isPending, isError, error }, idx) => ({
          data,
          chartConfig: chartConfigs[idx],
          isDataLoading: isPending,
          isResponseFailed: isError,
          isUserForbidden: getResponseFromError(error)?.status === StatusCodes.FORBIDDEN,
        })),
      };
    },
    [chartConfigs, selectedBenchmarkType],
  );

  const { scorecardsResult } = useQueries({
    queries: chartConfigs.map((chartConfig) => ({
      queryKey: ['getUniverseBenchmarkScorecard', getUniqueKeyForAnalyticsComponent(chartConfig)],
      queryFn: () =>
        universeInsightsClient.getUniverseBenchmarkScorecard({
          universeId,
          metric: getFirstMetricFromPredefinedChart(chartConfig),
        }),
      enabled: !isUniverseLoading,
      retry,
    })),
    combine,
  });

  const onClickCard = useCallback(
    (chartConfig: ChartConfig) => {
      const metric = getFirstMetricFromPredefinedChart(chartConfig);
      logClickBenchmarkScoreCard(unifiedLogger, universeId, metric);

      const queryParams = getExploreModeUrlParams({
        preset: chartConfig,
        chartContext: { granularity: RAQIV2MetricGranularity.OneDay },
        annotationOptions: [
          AnnotationType.PlaceIcon,
          AnnotationType.PlaceThumbnail,
          AnnotationCategory.Insights,
        ],
        routerForReferrerParam: router,
      });
      const url = buildExperienceAnalyticsUrlWithParams(
        analyticsExploreNavigationItem,
        queryParams,
        universeId,
      );
      return router.push(url);
    },
    [router, unifiedLogger, universeId],
  );

  // Function to get benchmark data for selected type
  const getBenchmarkDataForType = useCallback(
    (data: BenchmarkScorecardData | undefined, selectedType: BenchmarkType | null) => {
      if (!data || !selectedType) {
        return data; // Return original data if no type selected
      }

      const benchmarkData = data.benchmarkDataByType.get(selectedType);
      if (!benchmarkData) {
        return data; // Fallback to original data if selected type not available
      }

      // Create new data object with selected benchmark type data
      return {
        ...data,
        currentPercentile: benchmarkData.currentPercentile ?? 0,
        P50Value: benchmarkData.percentileMap?.['50'] ?? 0,
        P90Value: benchmarkData.percentileMap?.['90'] ?? 0,
      };
    },
    [],
  );

  const lastCardRef = useRef<HTMLDivElement>(null);
  // Use daily chart config keys as stable keys to prevent re-mounting when switching metric types
  const stableKeys = useMemo(
    () => regularChartConfigs.map((config) => getUniqueKeyForAnalyticsComponent(config)),
    [],
  );

  const cards = useMemo(
    () =>
      scorecardsResult.map(({ data, chartConfig, ...state }, idx) => {
        const benchmarkData = getBenchmarkDataForType(data, selectedBenchmarkType);

        return (
          <Grid
            key={stableKeys[idx]}
            item
            XSmall={columns / numOfCardsPerRow}
            minWidth={minCardWidth}
            ref={idx === scorecardsResult.length - 1 ? lastCardRef : undefined}>
            <BenchmarkScoreCard
              universeId={universeId}
              chartConfig={chartConfig}
              onClick={onClickCard}
              eventLogging={scoreCardEventLogging}
              state={state}
              benchmarkData={benchmarkData}
            />
          </Grid>
        );
      }),
    [
      numOfCardsPerRow,
      onClickCard,
      scorecardsResult,
      universeId,
      getBenchmarkDataForType,
      selectedBenchmarkType,
      stableKeys,
    ],
  );

  const numOfUnCollapsibleCards = numOfCardsPerRow === 1 ? 3 : cards.length;
  const numOfCollapsibleCard = cards.length - numOfUnCollapsibleCards;

  const [isExpanded, setIsExpanded] = useState(false);
  const viewAllBenchmarksButton = useMemo(() => {
    if (numOfCollapsibleCard === 0) {
      return null;
    }

    const buttonLabelKey = isExpanded
      ? translationKey('Label.ViewLess', TranslationNamespace.Insights)
      : translationKey('Label.ViewAll', TranslationNamespace.Insights);

    return (
      <Button
        endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        onClick={() => {
          setIsExpanded((wasExpanded) => !wasExpanded);
          logClickViewAllBenchmarks(unifiedLogger, universeId);
          if (!isExpanded) {
            // scroll to the last card upon expanding
            lastCardRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        color='primary'
        variant='text'
        disableRipple>
        {translate(buttonLabelKey)}
      </Button>
    );
  }, [isExpanded, numOfCollapsibleCard, translate, unifiedLogger, universeId]);

  // Get available benchmark types from first scorecard data
  const availableBenchmarkTypes = useMemo(() => {
    const firstScorecard = scorecardsResult[0]?.data;
    const types = firstScorecard?.availableBenchmarkTypes;
    return types ? new Set(types) : null;
  }, [scorecardsResult]);

  const title = useMemo(() => {
    let formattedTitle: React.ReactNode;

    if (availableBenchmarkTypes && selectedBenchmarkType) {
      if (availableBenchmarkTypes.size > 1) {
        formattedTitle = translateHTML(
          translationKey('Title.BenchmarksBasedOnDropdown', TranslationNamespace.Insights),
          [
            {
              opening: 'dropdownStart',
              closing: 'dropdownEnd',
              content() {
                return (
                  <Suspense
                    fallback={
                      <Skeleton
                        width={100}
                        animate
                        variant='text'
                        style={{ display: 'inline-flex' }}
                      />
                    }>
                    <BenchmarkTypeDropdown
                      availableTypes={availableBenchmarkTypes}
                      selectedType={selectedBenchmarkType}
                      onTypeChange={setSelectedBenchmarkType}
                      benchmarkScorecardData={scorecardsResult[0]?.data} // All benchmarks should be based on the same genre
                    />
                  </Suspense>
                );
              },
            },
          ],
        );
      } else {
        formattedTitle = translateHTML(
          translationKey('Title.BenchmarksBasedOnType', TranslationNamespace.Insights),
          [
            {
              opening: 'benchmarkTypeStart',
              closing: 'benchmarkTypeEnd',
              content() {
                const firstScorecard = scorecardsResult[0]?.data;
                const benchmarkData =
                  firstScorecard?.benchmarkDataByType?.get(selectedBenchmarkType);
                const baseName = getBenchmarkTypeDisplayName(selectedBenchmarkType, translate);

                // If it's a genre benchmark, try to get the specific genre name
                if (selectedBenchmarkType === BenchmarkType.Genre && benchmarkData?.genre) {
                  const { genre } = benchmarkData;

                  if (genre && isValidEnumValue(BenchmarkGenre, genre)) {
                    // Special case: when genre is General, show "all experiences" instead
                    if (genre === BenchmarkGenre.General) {
                      return translate(
                        translationKey('Label.AllExperiences', TranslationNamespace.Insights),
                      ).toLocaleLowerCase(locale);
                    }

                    const genreTranslationKey = benchmarkGenreToTranslationKey[genre];
                    if (genreTranslationKey) {
                      const genreName = translate(genreTranslationKey);
                      return `${genreName} ${baseName}`.toLocaleLowerCase(locale);
                    }
                  }
                }

                return baseName.toLocaleLowerCase(locale);
              },
            },
          ],
        );
      }
    } else {
      formattedTitle = translate(
        translationKey('Title.LatestDayBenchmarks', TranslationNamespace.Insights),
      );
    }

    return formattedTitle;
  }, [
    availableBenchmarkTypes,
    selectedBenchmarkType,
    scorecardsResult,
    locale,
    translate,
    translateHTML,
  ]);

  const metricAverageTypeDropdown = useMemo(() => <MetricAverageTypeDropdown />, []);

  const subtitle = useMemo(() => {
    // Use L7-specific subtitle when L7 flag is enabled
    const subtitleKey = translationKey(
      'Subtitle.OverviewBenchmarkScorecards',
      TranslationNamespace.Insights,
    );

    return (
      <Typography variant='body2' color='secondary' fontWeight={400}>
        {translateHTML(subtitleKey, [
          {
            opening: 'acquisitionLinkStart',
            closing: 'acquisitionLinkEnd',
            content(chunks: ReactNode) {
              const logClick = () => {
                logClickViewRFYSignals(unifiedLogger, universeId);
              };
              const url =
                creatorHub.dashboard.getAnalyticAcquisitionHomeRecommendationsUrl(universeId);
              // default to L28Days if isHomeAcquisitionSignalsEnabledValue is on
              const urlWithRangeType = `${url}&${AnalyticsQueryParams.RangeType}=${RAQIV2DateRangeType.Last28Days}`;
              return (
                <Link
                  href={isHomeAcquisitionSignalsEnabledValue ? urlWithRangeType : url}
                  target='_blank'
                  onClick={logClick}
                  color='inherit'>
                  <span style={{ fontWeight: 700, textDecoration: 'underline' }}>{chunks}</span>
                </Link>
              );
            },
          },
        ])}
      </Typography>
    );
  }, [translateHTML, unifiedLogger, universeId, isHomeAcquisitionSignalsEnabledValue]);

  const benchmarkOnboardingConfig = {
    featureKey: OnboardingFeatureKey.CreatorHubAnalyticsOverviewL7Metrics,
    stepKey: OnboardingStepKey.OverviewL7Benchmarks,
  };

  return (
    <Section
      title={title}
      subtitle={subtitle}
      subtitleAction={metricAverageTypeDropdown}
      onboardingTipsConfig={benchmarkOnboardingConfig}>
      <Grid
        ref={containerRef}
        container
        rowSpacing={`${rowSpacing}px`}
        columnSpacing={`${columnSpacing}px`}
        columns={columns}>
        {cards.slice(0, numOfUnCollapsibleCards)}
      </Grid>
      <Collapse in={isExpanded}>
        <Grid
          container
          rowSpacing={`${rowSpacing}px`}
          columnSpacing={`${columnSpacing}px`}
          paddingTop={`${rowSpacing}px`}
          columns={columns}>
          {cards.slice(numOfUnCollapsibleCards)}
        </Grid>
      </Collapse>
      {viewAllBenchmarksButton && (
        <Grid container justifyContent='center' paddingTop={`${rowSpacing}px`}>
          {viewAllBenchmarksButton}
        </Grid>
      )}
    </Section>
  );
};

export default BenchmarkScoreCardsSection;
