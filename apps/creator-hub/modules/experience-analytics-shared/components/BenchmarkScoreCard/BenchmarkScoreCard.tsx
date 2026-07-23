import type { FC } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { subDays } from '@rbx/core';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import { InfoOutlinedIcon, RobuxIcon, Tooltip, Typography, makeStyles } from '@rbx/ui';
import type { ComparisonChipSpec } from '@modules/charts-generic/charts/ComparisonChip';
import ComparisonChip from '@modules/charts-generic/charts/ComparisonChip';
import { NumberContext, NumberIcon } from '@modules/charts-generic/charts/numberFormatters';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import GenericBenchmarkScoreCard from '@modules/charts-generic/components/BenchmarkScoreCard/BenchmarkScoreCard';
import useComponentSize from '@modules/charts-generic/components/useComponentSize';
import { getComparisonChipTooltip } from '@modules/charts-generic/utils/comparisonChipUtils';
import Flex from '@modules/miscellaneous/components/Flex';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import useDebouncedFunction from '@modules/miscellaneous/hooks/useDebouncedFunction';
import getAnalyticsMetricDisplayConfig from '../../constants/AnalyticsMetricDisplayConfig';
import type { ChartConfig } from '../../constants/RAQIV2PredefinedChartConfig';
import {
  getFirstMetricFromPredefinedChart,
  getTitleKeyFromPredefinedChart,
} from '../../constants/RAQIV2PredefinedChartConfig';
import { useExperienceAnalyticsGameDetails } from '../../context/ExperienceAnalyticsGameDetailsProvider';
import { useUniverseResource } from '../../hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import { ChartDisplayContext } from '../../types/RAQIV2ChartConfig';
import formatAnalyticsNumber from '../../utils/analyticsNumberFormatter';
import { generateAnalyticsNumberFormattingSpec } from '../../utils/analyticsNumberFormattingSpec';
import computeRAQIV2LoggingMetricOverride from '../../utils/computeRAQIV2LoggingMetricOverride';
import ImpressionLogger from '../ImpressionLogger';
import useScoreCardSuggestions from './useScoreCardSuggestions';

const useScoreCardStyle = makeStyles()(() => ({
  titleContainer: {
    height: '20px',
  },
  titleLabel: {
    lineClamp: 1,
    WebkitLineClamp: 1,
    boxOrient: 'vertical',
    '-webkit-box-orient': 'vertical',
    '@supports (display: -webkit-box)': {
      display: '-webkit-box',
    },
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    lineHeight: '20px',
  },
  suggestionTooltipContainer: {
    padding: '10px 16px',
    maxWidth: '400px',
  },
  suggestionTextContainer: {
    margin: '2px 0',
    lineHeight: '130%',
  },
}));

type BenchmarkScoreCardProps = {
  universeId: number;
  chartConfig: ChartConfig;
  onClick?: (chartConfig: ChartConfig) => void;
  eventLogging?: {
    comparisonChipHoverEventName: string;
    suggestionHoverEventName: string;
    impressionEventName: string;
  };
  state: GenericChartState;
  benchmarkData?: {
    // Previously BenchmarkScorecardData, now mostly using deprecated fields
    currentValue: number;
    currentPercentile: number;
    P50Value: number;
    P90Value: number;
    percentChange: number;
    metricTime: string;
  };
};

const BenchmarkScoreCard: FC<BenchmarkScoreCardProps> = ({
  chartConfig,
  onClick: onClickGiven,
  eventLogging,
  state,
  benchmarkData,
}) => {
  const { id: universeId } = useUniverseResource();
  const gameDetails = useExperienceAnalyticsGameDetails();
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { translate } = translationDependencies;
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const {
    classes: { titleLabel, titleContainer, suggestionTooltipContainer, suggestionTextContainer },
  } = useScoreCardStyle();

  const titleKey = useMemo(() => getTitleKeyFromPredefinedChart(chartConfig), [chartConfig]);
  const scorecardTitleKey = useMemo(
    () => getTitleKeyFromPredefinedChart(chartConfig, ChartDisplayContext.Scorecard),
    [chartConfig],
  );
  const metric = useMemo(() => getFirstMetricFromPredefinedChart(chartConfig), [chartConfig]);
  const { localizedName, isPositiveGood, loggingMetricOverride } =
    getAnalyticsMetricDisplayConfig(metric);
  const valueFormatter = useCallback(
    (value: number) =>
      formatAnalyticsNumber(
        value,
        {
          metric,
          context: NumberContext.CardSummary,
        },
        translationDependencies,
      ),
    [metric, translationDependencies],
  );
  const loggingMetric = computeRAQIV2LoggingMetricOverride(metric, loggingMetricOverride);

  const onClick = useMemo(
    () =>
      onClickGiven
        ? () => {
            onClickGiven(chartConfig);
          }
        : undefined,
    [chartConfig, onClickGiven],
  );

  /** Beginning of title label tooltip related logic
   * Check if title label is truncated and set it to tooltip if it is.
   * If label width + icon width === title container width, set tooltip
   */
  const titleLabelRef = useRef<HTMLSpanElement>(null);
  const titleIconRef = useRef<HTMLDivElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const { width: titleContainerWidth } = useComponentSize(titleContainerRef, 300);
  const titleLabelMarginRight = 8;
  const [titleLabelInTooltip, setTitleLabelInTooltip] = useState('');

  useEffect(() => {
    if (titleLabelRef.current) {
      const { width: titleLabelWidth } = titleLabelRef.current.getBoundingClientRect();

      if (
        titleLabelWidth +
          (titleIconRef.current
            ? titleIconRef.current.getBoundingClientRect().width + titleLabelMarginRight
            : 0) ===
        titleContainerWidth
      ) {
        setTitleLabelInTooltip(titleLabelRef.current.innerText);
      } else {
        setTitleLabelInTooltip('');
      }
    }
  }, [titleContainerWidth]);
  /** end of title label tooltip logic */

  /** Beginning of suggestions & title */
  const suggestionCandidates = useScoreCardSuggestions({
    metric,
    universeId,
    placeId: gameDetails.rootPlaceId,
  });
  const suggestions = useMemo(() => {
    if (
      suggestionCandidates.length === 0 ||
      !benchmarkData ||
      benchmarkData.currentValue > benchmarkData.P50Value
    ) {
      return null;
    }
    // ARPPU needs at least 50 paying users to show suggestions
    if (metric === RAQIV2Metric.AverageRevenuePerPayingUser && benchmarkData.currentValue < 50) {
      return null;
    }

    return (
      <Flex flexDirection='column' justifyContent='space-between'>
        {suggestionCandidates.map(({ recommendationType, suggestion }) => {
          return (
            <div key={recommendationType} className={suggestionTextContainer}>
              <Typography variant='smallLabel2' lineHeight='130%'>
                {suggestion}
              </Typography>
            </div>
          );
        })}
      </Flex>
    );
  }, [benchmarkData, metric, suggestionCandidates, suggestionTextContainer]);

  const logSuggestionHoverEvent = useCallback(() => {
    if (eventLogging?.suggestionHoverEventName) {
      unifiedLogger.logHoverEvent({
        eventName: eventLogging.suggestionHoverEventName,
        parameters: {
          universe_id: `${universeId}`,
          metric: loggingMetric,
        },
      });
    }
  }, [eventLogging?.suggestionHoverEventName, loggingMetric, unifiedLogger, universeId]);
  const [debouncedSuggestionHoverLogging, clearDebouncedSuggesitonHoverLogging] =
    useDebouncedFunction(logSuggestionHoverEvent, 500);

  const title = useMemo(
    () => (
      <Flex
        ref={titleContainerRef}
        alignItems='center'
        justifyContent='space-between'
        classes={{ root: titleContainer }}>
        <Tooltip title={titleLabelInTooltip} placement='top' arrow>
          <Typography
            ref={titleLabelRef}
            variant='smallLabel2'
            color='secondary'
            lineHeight='140%'
            marginRight={suggestions ? `${titleLabelMarginRight}px` : undefined}
            classes={{ root: titleLabel }}>
            {translate(scorecardTitleKey ?? titleKey ?? localizedName)}
          </Typography>
        </Tooltip>
        {suggestions ? (
          <Tooltip
            ref={titleIconRef}
            title={suggestions}
            arrow
            classes={{ tooltip: suggestionTooltipContainer }}
            onMouseEnter={debouncedSuggestionHoverLogging}
            onMouseLeave={clearDebouncedSuggesitonHoverLogging}>
            <InfoOutlinedIcon color='inherit' />
          </Tooltip>
        ) : null}
      </Flex>
    ),
    [
      clearDebouncedSuggesitonHoverLogging,
      debouncedSuggestionHoverLogging,
      localizedName,
      scorecardTitleKey,
      suggestionTooltipContainer,
      suggestions,
      titleContainer,
      titleKey,
      titleLabel,
      titleLabelInTooltip,
      translate,
    ],
  );
  /** End of suggestions & title */

  /** Beginning of comparison chip */
  const logComparisonHoverEvent = useCallback(() => {
    if (eventLogging?.comparisonChipHoverEventName) {
      unifiedLogger.logHoverEvent({
        eventName: eventLogging.comparisonChipHoverEventName,
        parameters: {
          universe_id: `${universeId}`,
          metric: computeRAQIV2LoggingMetricOverride(metric, loggingMetricOverride),
        },
      });
    }
  }, [
    eventLogging?.comparisonChipHoverEventName,
    metric,
    unifiedLogger,
    universeId,
    loggingMetricOverride,
  ]);
  const [debouncedComparisonHoverLogging, clearDebouncedComparisonHoverLogging] =
    useDebouncedFunction(logComparisonHoverEvent, 500);

  const comparisonChip = useMemo(() => {
    if (!benchmarkData) {
      return null;
    }

    const startDate = new Date(benchmarkData.metricTime);
    const comparisonChipSpec: ComparisonChipSpec = {
      percentage: Math.abs(benchmarkData.percentChange),
      isUp: benchmarkData.percentChange > 0,
      isGood:
        (isPositiveGood && benchmarkData.percentChange > 0) ||
        (!isPositiveGood && benchmarkData.percentChange < 0),
      tooltip: getComparisonChipTooltip({
        translate,
        startDate,
        // benchmark percentChange is measured against the 7 days before the metricTime
        comparisonStartDate: subDays(startDate, 7),
      }),
      hasBackground: true,
    };

    return (
      <span
        onMouseEnter={debouncedComparisonHoverLogging}
        onMouseLeave={clearDebouncedComparisonHoverLogging}>
        <ComparisonChip {...comparisonChipSpec} />
      </span>
    );
  }, [
    benchmarkData,
    clearDebouncedComparisonHoverLogging,
    debouncedComparisonHoverLogging,
    isPositiveGood,
    translate,
  ]);
  /** End of comparison chip */

  const impressionLoggingParamters = useMemo(
    () => ({
      universe_id: `${universeId}`,
      metric: loggingMetric,
    }),
    [loggingMetric, universeId],
  );

  const scoreIcon = useMemo(() => {
    const { icon } = generateAnalyticsNumberFormattingSpec({
      metric,
      context: NumberContext.CardSummary,
    });
    return icon === NumberIcon.Robux ? <RobuxIcon /> : undefined;
  }, [metric]);

  const card = useMemo(
    () => (
      <GenericBenchmarkScoreCard
        title={title}
        currentPercentile={benchmarkData?.currentPercentile ?? 0}
        currentScore={benchmarkData?.currentValue ?? 0}
        scoreIcon={scoreIcon}
        P50Score={benchmarkData?.P50Value ?? 0}
        P90Score={benchmarkData?.P90Value ?? 0}
        valueFormatter={valueFormatter}
        onClick={onClick}
        comparisonChip={comparisonChip}
        {...state}
      />
    ),
    [
      benchmarkData?.P50Value,
      benchmarkData?.P90Value,
      benchmarkData?.currentPercentile,
      benchmarkData?.currentValue,
      comparisonChip,
      onClick,
      scoreIcon,
      state,
      title,
      valueFormatter,
    ],
  );

  return eventLogging ? (
    <ImpressionLogger
      eventName={eventLogging.impressionEventName}
      parameters={impressionLoggingParamters}>
      {card}
    </ImpressionLogger>
  ) : (
    card
  );
};

export default memo(BenchmarkScoreCard);
