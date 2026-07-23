import type { FC } from 'react';
import { useMemo } from 'react';
import { RobuxIcon } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import GenericSummaryCard from '@modules/charts-generic/cards/summaryCards/GenericSummaryCard';
import { filterNumericChartSummaryItemSpecs } from '@modules/charts-generic/charts/ChartSummaryItem';
import ComparisonChip from '@modules/charts-generic/charts/ComparisonChip';
import formatChartUnit from '@modules/charts-generic/charts/formatChartUnit';
import { formatSingleDate } from '@modules/charts-generic/charts/formatters/timeFormatters';
import { NumberIcon } from '@modules/charts-generic/charts/numberFormatters';
import { noDataSymbol } from '@modules/charts-generic/components/MetricValue/MetricValue';
import { useAnalyticsCurrentSingleDateBundle } from '@modules/charts-generic/context/AnalyticsQuerySingleDateBundleContext';
import useLocale from '@modules/charts-generic/context/useLocale';
import genericRAQIV2SeriesSummaryAdapter from '../../../adapters/genericRAQIV2SeriesSummaryAdapter';
import { RAQIV2SummaryCardStyle } from '../../../constants/RAQIV2PredefinedSummaryCardConfig';
import { RAQIV2SummaryCardType } from '../../../constants/RAQIV2SummaryCardType';
import type { RAQIV2CompoundSingleMetricSummaryType } from '../../../enums/RAQIV2SummaryType';
import useRAQIV2Request from '../../../hooks/useRAQIV2Request';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import type RAQIV2ChartSpec from '../../../types/RAQIV2ChartSpec';
import type { GenericRAQIV2SummaryLabel } from '../../../types/RAQIV2SummaryCardShared';
import getFetchComparison from '../../../utils/getFetchComparison';
import type { MakeRAQIV2RequestOptions } from '../../../utils/makeRAQIV2Request';
import { getMetricLabelFromMetricLike } from '../../../utils/metricLikeSemantics';

export type GenericRAQIV2SummaryCardProps = {
  spec: RAQIV2ChartSpec;
  summaryType: RAQIV2CompoundSingleMetricSummaryType;
  label?: GenericRAQIV2SummaryLabel;
  labelText?: FormattedText;
  ignoreCache?: boolean;
  fullWidth?: boolean;
  /**
   * When true, the card fetches comparison data and renders a comparison chip
   * (e.g. ↑ 2.4%) next to the value. Opt-in to avoid issuing extra comparison
   * requests for cards that don't need it.
   */
  showComparisonChip?: boolean;
};

// TODO(shumingxu, 04/15/2024): DSA-2249: Consolidate performance and audience pages' summaries to use
// the same component. This is dependent on migrating them to RAQI.
const GenericRAQIV2MetricSummaryCard: FC<GenericRAQIV2SummaryCardProps> = ({
  spec,
  summaryType,
  label,
  labelText,
  ignoreCache,
  fullWidth,
  showComparisonChip,
}) => {
  const locale = useLocale();
  const { date } = useAnalyticsCurrentSingleDateBundle();
  const translationDependencies = useRAQIV2TranslationDependencies();

  const RAQIV2RequestOptions: MakeRAQIV2RequestOptions = useMemo(
    // TODO(shumingxu, 04/15/2024): DSA-2250: Using fetchTotalSeries might not be ideal here since it doesn't
    // use none granularity to optimize the query. But should be fine for now.
    () => ({
      fetchTotalSeries: true,
      fetchComparison: showComparisonChip ? getFetchComparison(true, spec.granularity) : undefined,
    }),
    [showComparisonChip, spec.granularity],
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

    if (!labelKey || labelType == null) {
      return undefined;
    }

    switch (labelType) {
      case 'dateAsStartDate':
        return translationDependencies.translate(labelKey, {
          date: formatSingleDate(locale, date),
        });
      case 'simple':
        return translationDependencies.translate(labelKey);
    }

    const exhaustiveCheck: never = labelType;
    return exhaustiveCheck;
  }, [label?.key, label?.type, translationDependencies, locale, date]);

  const metricLabel: FormattedText = useMemo(
    () =>
      labelText ??
      translatedLabelKey ??
      summary?.specificLabel ??
      getMetricLabelFromMetricLike(spec.metric, translationDependencies),
    [labelText, spec.metric, summary?.specificLabel, translatedLabelKey, translationDependencies],
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

  // Auto-detect Robux icon for metrics whose formatting spec resolves to
  // `NumberIcon.Robux`. This mirrors the existing chart behavior (see
  // `ChartSummaryItem`) so any summary card backed by a Robux-unit metric
  // renders the Robux icon without per-card config.
  //
  // Luobu safety: `getIconForUnit` in `analyticsNumberFormattingSpec.ts`
  // already gates `NumberIcon.Robux` on `process.env.buildTarget !== 'luobu'`,
  // so this check is transitively Luobu-safe — no explicit `buildTarget`
  // guard is needed here.
  const valueLeadingIcon = useMemo(
    () =>
      summary?.formattingSpec?.icon === NumberIcon.Robux ? (
        <RobuxIcon fontSize='large' />
      ) : undefined,
    [summary?.formattingSpec?.icon],
  );

  // Mirrors `ChartSummaryItem`: `numberContextMetadata` is a sibling field on
  // the summary spec (not part of `comparisonChipSpec`) and must be threaded
  // through explicitly so `ComparisonChip` can pick up
  // `inRoundedComparisonChipContext` for 0-decimal rounding.
  const comparisonChip = useMemo(
    () =>
      showComparisonChip && summary?.comparisonChipSpec ? (
        <ComparisonChip
          {...summary.comparisonChipSpec}
          numberContextMetadata={summary.numberContextMetadata}
        />
      ) : undefined,
    [showComparisonChip, summary?.comparisonChipSpec, summary?.numberContextMetadata],
  );

  return (
    <GenericSummaryCard
      label={formattedLabel}
      value={formattedValue}
      valueLeadingIcon={valueLeadingIcon}
      comparisonChip={comparisonChip}
      {...chartState}
      fullWidth={fullWidth}
      styleConfig={RAQIV2SummaryCardStyle[RAQIV2SummaryCardType.TopBreakdown]}
    />
  );
};

export default GenericRAQIV2MetricSummaryCard;
