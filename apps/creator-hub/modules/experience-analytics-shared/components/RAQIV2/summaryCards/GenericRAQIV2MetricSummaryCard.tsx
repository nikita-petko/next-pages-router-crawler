import React, { FC, useMemo } from 'react';
import {
  GenericSummaryCard,
  formatSingleDate,
  noDataSymbol,
  useAnalyticsCurrentSingleDateBundle,
  useLocale,
  formatChartUnit,
  filterNumericChartSummaryItemSpecs,
} from '@modules/charts-generic';
import { FormattedText, TranslationKey } from '@modules/analytics-translations';
import genericRAQIV2SeriesSummaryAdapter from '../../../adapters/genericRAQIV2SeriesSummaryAdapter';
import RAQIV2ChartSpec from '../../../types/RAQIV2ChartSpec';
import { MakeRAQIV2RequestOptions } from '../../../utils/makeRAQIV2Request';
import useRAQIV2Request from '../../../hooks/useRAQIV2Request';
import { RAQIV2CompoundSingleMetricSummaryType } from '../../../enums/RAQIV2SummaryType';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import { RAQIV2SummaryCardStyle } from '../../../constants/RAQIV2PredefinedSummaryCardConfig';
import RAQIV2SummaryCardType from '../../../constants/RAQIV2SummaryCardType';
import getAnalyticsMetricDisplayConfig from '../../../constants/AnalyticsMetricDisplayConfig';
import { isComputedMetric } from '../../../types/ComputedMetric';
import { getMetricLabelFromMetricLike } from '../../../utils/metricLikeSemantics';

export type GenericRAQIV2SummaryLabel = {
  key: TranslationKey;
  tooltip?: TranslationKey;
  type: 'simple' | 'dateAsStartDate';
};

export type GenericRAQIV2SummaryCardProps = {
  spec: RAQIV2ChartSpec;
  summaryType: RAQIV2CompoundSingleMetricSummaryType;
  label?: GenericRAQIV2SummaryLabel;
  ignoreCache?: boolean;
  fullWidth?: boolean;
};

// TODO(shumingxu, 04/15/2024): DSA-2249: Consolidate performance and audience pages' summaries to use
// the same component. This is dependent on migrating them to RAQI.
const GenericRAQIV2MetricSummaryCard: FC<GenericRAQIV2SummaryCardProps> = ({
  spec,
  summaryType,
  label,
  ignoreCache,
  fullWidth,
}) => {
  const locale = useLocale();
  const { date } = useAnalyticsCurrentSingleDateBundle();
  const translationDependencies = useRAQIV2TranslationDependencies();

  const RAQIV2RequestOptions: MakeRAQIV2RequestOptions = useMemo(
    // TODO(shumingxu, 04/15/2024): DSA-2250: Using fetchTotalSeries might not be ideal here since it doesn't
    // use none granularity to optimize the query. But should be fine for now.
    () => ({ fetchTotalSeries: true, fetchComparison: undefined }),
    [],
  );

  const { data: raqiData, ...chartState } = useRAQIV2Request(
    spec,
    RAQIV2RequestOptions,
    ignoreCache,
  );

  const summary = useMemo(() => {
    const summaries = filterNumericChartSummaryItemSpecs(
      genericRAQIV2SeriesSummaryAdapter({
        responses: raqiData ?? { response: null },
        spec,
        translationDependencies,
        summarySpec: {
          totalSummaryTypes: [summaryType],
          perBreakdownSummaryTypes: [],
          aggregatedBreakdownSummaryTypes: [],
        },
      }),
    );

    return summaries.length ? summaries[0] : null;
  }, [raqiData, spec, summaryType, translationDependencies]);

  const translatedLabelKey = useMemo(() => {
    const labelKey = label?.key;
    const labelType = label?.type;

    if (labelKey) {
      switch (labelType) {
        case 'simple':
          return translationDependencies.translate(labelKey);
        case 'dateAsStartDate':
          return translationDependencies.translate(labelKey, {
            date: formatSingleDate(locale, date),
          });
        default:
          return undefined;
      }
    }
    return undefined;
  }, [label?.key, label?.type, translationDependencies, locale, date]);

  const metricLabel: FormattedText = useMemo(
    () =>
      translatedLabelKey ??
      summary?.specificLabel ??
      (isComputedMetric(spec.metric)
        ? getMetricLabelFromMetricLike(spec.metric)
        : translationDependencies.translate(
            getAnalyticsMetricDisplayConfig(spec.metric).localizedName,
          )),
    [spec.metric, summary?.specificLabel, translatedLabelKey, translationDependencies],
  );

  const translatedTooltip = useMemo(
    () => (label?.tooltip ? translationDependencies.translate(label.tooltip) : undefined),
    [label?.tooltip, translationDependencies],
  );

  const formattedValue = useMemo(
    () =>
      summary ? formatChartUnit(summary.value, summary, translationDependencies) : noDataSymbol,
    [summary, translationDependencies],
  );

  const formattedLabel = useMemo(
    () => ({ labelText: metricLabel, tooltip: translatedTooltip }),
    [metricLabel, translatedTooltip],
  );

  return (
    <GenericSummaryCard
      label={formattedLabel}
      value={formattedValue}
      {...chartState}
      fullWidth={fullWidth}
      styleConfig={RAQIV2SummaryCardStyle[RAQIV2SummaryCardType.TopBreakdown]}
    />
  );
};

export default GenericRAQIV2MetricSummaryCard;
