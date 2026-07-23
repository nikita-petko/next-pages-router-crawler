import type { FC } from 'react';
import { useMemo, useRef } from 'react';
import type { FormattedText, TranslationKey } from '@modules/analytics-translations/types';
import { SummaryValueType } from '@modules/charts-generic/charts/ChartSummaryItem';
import { NumberContext } from '@modules/charts-generic/charts/numberFormatters';
import { noDataSymbol } from '@modules/charts-generic/components/MetricValue/MetricValue';
import SummaryItem from '@modules/charts-generic/components/SummaryItem';
import type { RAQIV2CompoundSummaryType } from '../../../enums/RAQIV2SummaryType';
import useRAQIV2Summary from '../../../hooks/useRAQIV2Summary';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import type RAQIV2ChartSpec from '../../../types/RAQIV2ChartSpec';
import formatAnalyticsNumber from '../../../utils/analyticsNumberFormatter';
import { getMetricLabelFromMetricLike } from '../../../utils/metricLikeSemantics';

type GenericRAQIV2SummaryItemProps = {
  spec: RAQIV2ChartSpec;
  summaryType: RAQIV2CompoundSummaryType;
  labelKey?: TranslationKey;
  ignoreCache?: boolean;
  showComparisonChip?: boolean;
  variant?: 'default' | 'compact';
};

const GenericRAQIV2MetricSummaryItem: FC<GenericRAQIV2SummaryItemProps> = ({
  spec,
  summaryType,
  labelKey,
  ignoreCache,
  showComparisonChip,
  variant,
}) => {
  const translationDependencies = useRAQIV2TranslationDependencies();

  const { summary, ...chartState } = useRAQIV2Summary(spec, summaryType, ignoreCache);

  const label = useMemo((): FormattedText => {
    if (labelKey) {
      return translationDependencies.translate(labelKey);
    }
    return (
      summary?.specificLabel ?? getMetricLabelFromMetricLike(spec.metric, translationDependencies)
    );
  }, [labelKey, spec.metric, summary?.specificLabel, translationDependencies]);

  const value = useMemo(() => {
    return summary?.summaryValueType === SummaryValueType.Numeric
      ? formatAnalyticsNumber(
          summary.value,
          {
            metric: spec.metric,
            context: NumberContext.CardSummary,
          },
          translationDependencies,
        )
      : noDataSymbol;
  }, [spec.metric, summary, translationDependencies]);

  const comparisonChipRef = useRef<HTMLDivElement>(null);

  return (
    <SummaryItem
      label={label}
      value={value}
      variant={variant}
      comparisonChipSpec={showComparisonChip ? summary?.comparisonChipSpec : undefined}
      comparisonChipRef={comparisonChipRef}
      {...chartState}
    />
  );
};

export default GenericRAQIV2MetricSummaryItem;
