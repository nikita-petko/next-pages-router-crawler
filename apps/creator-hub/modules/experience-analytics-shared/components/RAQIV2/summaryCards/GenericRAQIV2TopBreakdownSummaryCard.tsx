import type { FC } from 'react';
import { useMemo } from 'react';
import type { FormattedText } from '@modules/analytics-translations/types';
import GenericSummaryCard from '@modules/charts-generic/cards/summaryCards/GenericSummaryCard';
import { noDataSymbol } from '@modules/charts-generic/components/MetricValue/MetricValue';
import genericRAQIV2TopBreakdownSummaryCardAdapter from '../../../adapters/genericRAQIV2TopBreakdownSummaryCardAdapter';
import { RAQIV2SummaryCardStyle } from '../../../constants/RAQIV2PredefinedSummaryCardConfig';
import { RAQIV2SummaryCardType } from '../../../constants/RAQIV2SummaryCardType';
import useRAQIV2Request from '../../../hooks/useRAQIV2Request';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import type { MakeRAQIV2RequestOptions } from '../../../utils/makeRAQIV2Request';
import { getMetricLabelFromMetricLike } from '../../../utils/metricLikeSemantics';
import type { GenericRAQIV2SummaryCardProps } from './GenericRAQIV2MetricSummaryCard';

const GenericRAQIV2TopBreakdownSummaryCard: FC<GenericRAQIV2SummaryCardProps> = ({
  spec,
  summaryType,
  label,
  ignoreCache,
}) => {
  const labelKey = label?.key;
  const tooltip = label?.tooltip;
  const translationDependencies = useRAQIV2TranslationDependencies();
  const granularity = spec.granularity;

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
        granularity,
        translationDependencies,
      }),
    [raqiData, granularity, spec, summaryType, translationDependencies],
  );

  const translatedLabelKey = useMemo(
    () => (labelKey ? translationDependencies.translate(labelKey) : undefined),
    [labelKey, translationDependencies],
  );
  const metricLabel: FormattedText = useMemo(
    () => translatedLabelKey ?? getMetricLabelFromMetricLike(spec.metric, translationDependencies),
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
