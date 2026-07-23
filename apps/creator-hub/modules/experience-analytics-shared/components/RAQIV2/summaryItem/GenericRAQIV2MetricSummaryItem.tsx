import React, { FC, useMemo, useRef } from 'react';
import {
  NumberContext,
  SummaryItem,
  SummaryValueType,
  noDataSymbol,
} from '@modules/charts-generic';
import { FormattedText, TranslationKey } from '@modules/analytics-translations';
import RAQIV2ChartSpec from '../../../types/RAQIV2ChartSpec';
import { RAQIV2CompoundSummaryType } from '../../../enums/RAQIV2SummaryType';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import useRAQIV2Summary from '../../../hooks/useRAQIV2Summary';
import getAnalyticsMetricDisplayConfig from '../../../constants/AnalyticsMetricDisplayConfig';
import formatAnalyticsNumber from '../../../utils/analyticsNumberFormatter';
import { isComputedMetric } from '../../../types/ComputedMetric';
import { getMetricLabelFromMetricLike } from '../../../utils/metricLikeSemantics';

type GenericRAQIV2SummaryItemProps = {
  spec: RAQIV2ChartSpec;
  summaryType: RAQIV2CompoundSummaryType;
  labelKey?: TranslationKey;
  ignoreCache?: boolean;
  showComparisonChip?: boolean;
};

const GenericRAQIV2MetricSummaryItem: FC<GenericRAQIV2SummaryItemProps> = ({
  spec,
  summaryType,
  labelKey,
  ignoreCache,
  showComparisonChip,
}) => {
  const translationDependencies = useRAQIV2TranslationDependencies();

  const { summary, ...chartState } = useRAQIV2Summary(spec, summaryType, ignoreCache);

  const label = useMemo((): FormattedText => {
    if (labelKey) return translationDependencies.translate(labelKey);
    if (isComputedMetric(spec.metric)) {
      return summary?.specificLabel ?? getMetricLabelFromMetricLike(spec.metric);
    }
    return (
      summary?.specificLabel ??
      translationDependencies.translate(getAnalyticsMetricDisplayConfig(spec.metric).localizedName)
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
      comparisonChipSpec={showComparisonChip ? summary?.comparisonChipSpec : undefined}
      comparisonChipRef={comparisonChipRef}
      {...chartState}
    />
  );
};

export default GenericRAQIV2MetricSummaryItem;
