import { useMemo } from 'react';
import type { FormattedText } from '@modules/analytics-translations/types';
import { SummaryValueType } from '@modules/charts-generic/charts/ChartSummaryItem';
import { NumberContext } from '@modules/charts-generic/charts/numberFormatters';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import { noDataSymbol } from '@modules/charts-generic/components/MetricValue/MetricValue';
import adaptAllRaqiV2SeriesWithComparisonAndSummary from '@modules/experience-analytics-shared/adapters/genericRAQIV2ChartAdapterWithComparison';
import type { RAQIV2CompoundSummaryType } from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import useRAQIV2Request from '@modules/experience-analytics-shared/hooks/useRAQIV2Request';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type RAQIV2ChartSpec from '@modules/experience-analytics-shared/types/RAQIV2ChartSpec';
import formatAnalyticsNumber from '@modules/experience-analytics-shared/utils/analyticsNumberFormatter';
import combineRAQIV2QueryResponses from '@modules/experience-analytics-shared/utils/combineRAQIV2QueryResponses';
import type { MakeRAQIV2RequestOptions } from '@modules/experience-analytics-shared/utils/makeRAQIV2Request';

// Single-period query: no period-over-period comparison. The shared
// useRAQIV2Summary always fetches a "combined" comparison, which doubles the
// queried window; for granularity None that returns one aggregated bucket that
// cannot be sliced back to the requested range, corrupting the total. We never
// render a comparison here, so we query a single period.
const SINGLE_PERIOD_REQUEST_OPTIONS: MakeRAQIV2RequestOptions = {
  fetchTotalSeries: true,
  fetchComparison: undefined,
};

export type DevExO18MetricSummary = {
  /** Raw numeric metric value, or null when not numeric / unavailable. */
  numericValue: number | null;
  /** Localized, formatted value for display (a no-data symbol when unavailable). */
  formattedValue: FormattedText;
  /** Loading / error / forbidden flags, spreadable into chart-state-aware components. */
  chartState: GenericChartState;
};

// Fetches a single RAQI V2 metric total (no comparison) and exposes both the raw
// numeric value (for inline use) and a localized formatted string (for display),
// alongside the request's chart state for loading/error rendering.
const useDevExO18MetricSummary = (
  spec: RAQIV2ChartSpec,
  summaryType: RAQIV2CompoundSummaryType,
): DevExO18MetricSummary => {
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { data: raqiData, ...chartState } = useRAQIV2Request(spec, SINGLE_PERIOD_REQUEST_OPTIONS);

  const { response } = combineRAQIV2QueryResponses(raqiData ?? { response: null });
  const { summary } = adaptAllRaqiV2SeriesWithComparisonAndSummary(
    { response, translationDependencies, granularity: spec.granularity, spec },
    {
      totalSummaryTypes: [summaryType],
      perBreakdownSummaryTypes: [],
      aggregatedBreakdownSummaryTypes: [],
    },
    undefined,
  );
  const summaryValue = summary.length ? summary[0] : null;

  const { numericValue, formattedValue } = useMemo(() => {
    const isNumeric = summaryValue?.summaryValueType === SummaryValueType.Numeric;
    return {
      numericValue: isNumeric ? summaryValue.value : null,
      formattedValue: isNumeric
        ? formatAnalyticsNumber(
            summaryValue.value,
            { metric: spec.metric, context: NumberContext.CardSummary },
            translationDependencies,
          )
        : noDataSymbol,
    };
  }, [spec.metric, summaryValue, translationDependencies]);

  return { numericValue, formattedValue, chartState };
};

export default useDevExO18MetricSummary;
