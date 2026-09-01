import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import type { TranslationKey } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { NumberContext } from '@modules/charts-generic/charts/numberFormatters';
import SummaryItem from '@modules/charts-generic/components/SummaryItem';
import type { RAQIV2CompoundSummaryType } from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type RAQIV2ChartSpec from '@modules/experience-analytics-shared/types/RAQIV2ChartSpec';
import formatAnalyticsNumber from '@modules/experience-analytics-shared/utils/analyticsNumberFormatter';
import useDevExO18MetricSummary from './useDevExO18MetricSummary';

type DevExO18PotentialEarningsSummaryProps = {
  spec: RAQIV2ChartSpec;
  summaryType: RAQIV2CompoundSummaryType;
  labelKey: TranslationKey;
};

// Thin presentation over useDevExO18MetricSummary: renders the metric total with
// label + loading/error states. Inline consumers that just need the value should
// call useDevExO18MetricSummary directly.
const DevExO18PotentialEarningsSummary: FC<DevExO18PotentialEarningsSummaryProps> = ({
  spec,
  summaryType,
  labelKey,
}) => {
  // Use the analytics translate wrapper so the namespaced TranslationKey resolves.
  const { translate } = useTranslationWrapper(useTranslation());
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { numericValue, formattedValue, chartState } = useDevExO18MetricSummary(spec, summaryType);

  // Render the headline as a full, non-abbreviated currency amount ($ + exactly
  // two decimals) instead of the hook's abbreviated card-summary format. Falls
  // back to the hook's formatted value (the no-data symbol) when unavailable.
  const displayValue = useMemo(
    () =>
      numericValue != null
        ? formatAnalyticsNumber(
            numericValue,
            { metric: spec.metric, context: NumberContext.DataPoint },
            translationDependencies,
          )
        : formattedValue,
    [numericValue, formattedValue, spec.metric, translationDependencies],
  );

  return <SummaryItem label={translate(labelKey)} value={displayValue} {...chartState} />;
};

export default DevExO18PotentialEarningsSummary;
