import React, { FC, useMemo } from 'react';
import {
  DailyTimeSeriesAlignedToUTCMidnight,
  GenericSummaryCard,
  noDataSymbol,
} from '@modules/charts-generic';
import { FormattedText } from '@modules/analytics-translations';
import { MakeRAQIV2RequestOptions } from '../../../utils/makeRAQIV2Request';
import useRAQIV2Request from '../../../hooks/useRAQIV2Request';
import RAQIV2MetricGranularityToSeriesIntervalMeaning from '../../../constants/RAQIV2MetricGranularityToSeriesIntervalMeaning';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import genericRAQIV2TopBreakdownSummaryCardAdapter from '../../../adapters/genericRAQIV2TopBreakdownSummaryCardAdapter';
import { RAQIV2SummaryCardStyle } from '../../../constants/RAQIV2PredefinedSummaryCardConfig';
import RAQIV2SummaryCardType from '../../../constants/RAQIV2SummaryCardType';
import { GenericRAQIV2SummaryCardProps } from './GenericRAQIV2MetricSummaryCard';
import getAnalyticsMetricDisplayConfig from '../../../constants/AnalyticsMetricDisplayConfig';
import { isComputedMetric } from '../../../types/ComputedMetric';
import { getMetricLabelFromMetricLike } from '../../../utils/metricLikeSemantics';

const GenericRAQIV2TopBreakdownSummaryCard: FC<GenericRAQIV2SummaryCardProps> = ({
  spec,
  summaryType,
  label: { key: labelKey, tooltip } = { key: undefined, type: 'simple' },
  ignoreCache,
}) => {
  const translationDependencies = useRAQIV2TranslationDependencies();
  const seriesIntervalMeaning = spec.granularity
    ? RAQIV2MetricGranularityToSeriesIntervalMeaning(spec.granularity)
    : DailyTimeSeriesAlignedToUTCMidnight;

  const RAQIV2RequestOptions: MakeRAQIV2RequestOptions = useMemo(
    () => ({ fetchTotalSeries: false, fetchComparison: undefined }),
    [],
  );
  const { data: raqiData, ...chartState } = useRAQIV2Request(
    spec,
    RAQIV2RequestOptions,
    ignoreCache,
  );

  const { summary } = useMemo(
    () =>
      genericRAQIV2TopBreakdownSummaryCardAdapter({
        spec,
        responses: raqiData ?? { response: null },
        summaryType,
        seriesIntervalMeaning,
        translationDependencies,
      }),
    [raqiData, seriesIntervalMeaning, spec, summaryType, translationDependencies],
  );

  const translatedLabelKey = useMemo(
    () => (labelKey ? translationDependencies.translate(labelKey) : undefined),
    [labelKey, translationDependencies],
  );
  const metricLabel: FormattedText = useMemo(
    () =>
      translatedLabelKey ??
      (isComputedMetric(spec.metric)
        ? getMetricLabelFromMetricLike(spec.metric)
        : translationDependencies.translate(
            getAnalyticsMetricDisplayConfig(spec.metric).localizedName,
          )),
    [spec.metric, translatedLabelKey, translationDependencies],
  );

  const translatedTooltip = useMemo(
    () => (tooltip ? translationDependencies.translate(tooltip) : undefined),
    [tooltip, translationDependencies],
  );

  const formattedValue = useMemo(
    () => summary?.specificLabel ?? noDataSymbol,
    [summary?.specificLabel],
  );

  const formattedLabel = useMemo(
    () => ({ labelText: metricLabel, tooltip: translatedTooltip }),
    [metricLabel, translatedTooltip],
  );

  return (
    <GenericSummaryCard
      label={formattedLabel}
      value={formattedValue}
      styleConfig={RAQIV2SummaryCardStyle[RAQIV2SummaryCardType.TopBreakdown]}
      {...chartState}
    />
  );
};

export default GenericRAQIV2TopBreakdownSummaryCard;
