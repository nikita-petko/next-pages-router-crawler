import { useEffect, useMemo, useRef } from 'react';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { Icon, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { TimeSeriesAnnotation } from '@modules/charts-generic/charts/types/Annotations';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import { UniverseAnnotationsClientProvider } from '@modules/charts-generic/context/annotations/UniverseAnnotationsClientProvider';
import { getCurrentDate, subHours } from '@modules/charts-generic/utils/dateUtils';
import emptyFunction from '@modules/charts-generic/utils/emptyFunction';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { O18Eligibility } from '@modules/clients/creatorDevexApi';
import AnalyticsConfigChart from '@modules/experience-analytics-shared/components/RAQIV2/AnalyticsConfigChart';
import type { TRAQIV2NumericUIMetric } from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import { ExperienceAnalyticsCurrentAnnotationsBundleContext } from '@modules/experience-analytics-shared/context/ExperienceAnalyticsCurrentAnnotationsBundleProvider';
import RAQIV2ClientProvider from '@modules/experience-analytics-shared/context/RAQIV2ClientProvider';
import { RAQIV2SummaryType } from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import type { AnalyticsCurrentAnnotationsBundleContextType } from '@modules/experience-analytics-shared/types/AnalyticsCurrentAnnotationsBundleContext';
import type { ChartConfig } from '@modules/experience-analytics-shared/types/RAQIV2ChartConfig';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import type RAQIV2ChartSpec from '@modules/experience-analytics-shared/types/RAQIV2ChartSpec';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import DevExO18PotentialEarningsSummary from './DevExO18PotentialEarningsSummary';

const DEVEX_O18_ANALYTICS_LOOKBACK_HOURS = 30 * 24;

const EMPTY_ANNOTATIONS: TimeSeriesAnnotation[] = [];

// This section shows a single fixed-range chart with no annotation UI, so supply
// a no-op bundle instead of the page-config-aware analytics annotation stack.
const noOpAnnotationsBundle: AnalyticsCurrentAnnotationsBundleContextType = {
  selectedAnnotationOptions: [],
  supportedAnnotationTypes: [],
  defaultAnnotationTypes: [],
  timeSeriesAnnotations: EMPTY_ANNOTATIONS,
  onAnnotationOptionsChange: emptyFunction,
  getCurrentSupportedAnnotations: () => EMPTY_ANNOTATIONS,
  updateTimeSeriesAnnotationsGivenChartContext: emptyFunction,
};

// Eligible experiences see realized USD earnings split by balance type
// (standard rate vs. 18+ rate), so the stacked bars add up to total earnings.
const chartConfigDevExO18EarningsByBalanceType = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Label.Metric.EarningsTotalUsd', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.DevExO18EarningsTotal',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.EarningsTotalUsd,
  overrides: {
    breakdown: { override: [RAQIV2Dimension.BalanceType] },
    granularity: { override: RAQIV2MetricGranularity.None },
    filter: { override: [] },
  },
  chartType: ChartType.Column,
  comparison: { chip: false },
  hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative: true,
  summarySpec: {
    totalSummaryTypes: [],
    perBreakdownSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

// Ineligible experiences see their potential USD earnings split by balance type
// to illustrate the upside of the standard vs. 18+ rate.
const chartConfigDevExO18PotentialEarningsByBalanceType = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Label.Metric.PotentialEarningsTotalUsd',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.DevExO18PotentialEarningsTotal',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.PotentialEarningsTotalUsd,
  overrides: {
    breakdown: { override: [RAQIV2Dimension.BalanceType] },
    granularity: { override: RAQIV2MetricGranularity.None },
    filter: { override: [] },
  },
  chartType: ChartType.Column,
  comparison: { chip: false },
  hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative: true,
  summarySpec: {
    totalSummaryTypes: [],
    perBreakdownSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

type DevExO18AnalyticsSectionProps = {
  universeId: number;
  o18Eligibility: O18Eligibility;
};

function DevExO18AnalyticsSection({ universeId, o18Eligibility }: DevExO18AnalyticsSectionProps) {
  const { translate } = useTranslation();

  const { startTime, endTime } = useMemo(() => {
    const end = getCurrentDate();
    return { startTime: subHours(end, DEVEX_O18_ANALYTICS_LOOKBACK_HOURS), endTime: end };
  }, []);

  const chartContext: RAQIV2ChartContext = useMemo(
    () => ({
      resource: { type: RAQIV2ChartResourceType.Universe, id: universeId },
      timeSpec: { rangeType: RAQIV2DateRangeType.Custom, startTime, endTime },
      timeAxisBounds: 'disabled',
      granularity: RAQIV2MetricGranularity.None,
      filter: [],
    }),
    [universeId, startTime, endTime],
  );

  // The single None-granularity bucket spans the whole lookback window, so the
  // chart's category axis labels it with just the start date. Relabel that lone
  // tick with the full range to convey the period the bar covers.
  const dateRangeLabel = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
    return `${formatter.format(startTime)} - ${formatter.format(endTime)}`;
  }, [startTime, endTime]);

  const chartWrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const wrapper = chartWrapperRef.current;
    if (!wrapper) {
      return undefined;
    }
    const applyRangeLabel = () => {
      const labels = wrapper.querySelectorAll('.highcharts-xaxis-labels text');
      // Only relabel when there is exactly one tick (the single aggregated bucket).
      if (labels.length === 1 && labels[0].textContent !== dateRangeLabel) {
        labels[0].textContent = dateRangeLabel;
      }
    };
    applyRangeLabel();
    const observer = new MutationObserver(applyRangeLabel);
    observer.observe(wrapper, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [dateRangeLabel]);

  const isEligible = o18Eligibility === O18Eligibility.Eligible;

  // Both states show the same "Total over the last 30 days" headline whose value
  // equals the combined height of the chart below — realized earnings when
  // eligible, total potential earnings when not.
  const summaryMetric: TRAQIV2NumericUIMetric = isEligible
    ? RAQIV2Metric.EarningsTotalUsd
    : RAQIV2Metric.PotentialEarningsTotalUsd;
  const summaryLabelKey = translationKey(
    'Title.DevExO18PotentialExtraEarnings',
    TranslationNamespace.DevEx,
  );

  const summarySpec: RAQIV2ChartSpec = useMemo(
    () => ({
      ...chartContext,
      metric: summaryMetric,
      filter: [],
    }),
    [chartContext, summaryMetric],
  );

  const chartConfig = isEligible
    ? chartConfigDevExO18EarningsByBalanceType
    : chartConfigDevExO18PotentialEarningsByBalanceType;

  return (
    <RAQIV2ClientProvider>
      <UniverseAnnotationsClientProvider>
        <ExperienceAnalyticsCurrentAnnotationsBundleContext.Provider value={noOpAnnotationsBundle}>
          <div
            className='flex flex-col gap-large radius-large padding-large stroke-standard stroke-default width-full height-full'
            data-testid='devex-o18-analytics-section'>
            <div className='flex flex-col gap-small'>
              <div className='flex items-center gap-xsmall'>
                <h2 className='content-emphasis margin-none text-heading-small'>
                  {translate(
                    isEligible
                      ? 'Title.DevExO18EarningUsO18Rate' /* TranslationNamespace.DevEx */
                      : 'Title.DevExO18Analytics' /* TranslationNamespace.DevEx */,
                  )}
                </h2>
                <Tooltip
                  position='top-center'
                  title={translate(
                    'Description.DevExO18RevenueByEligibility' /* TranslationNamespace.DevEx */,
                  )}>
                  <TooltipTrigger asChild>
                    <span className='flex items-center content-muted'>
                      <Icon size='Small' name='icon-regular-circle-i' />
                    </span>
                  </TooltipTrigger>
                </Tooltip>
              </div>
            </div>
            <DevExO18PotentialEarningsSummary
              spec={summarySpec}
              summaryType={{ type: RAQIV2SummaryType.Total }}
              labelKey={summaryLabelKey}
            />
            <div ref={chartWrapperRef} className='flex flex-col grow-1'>
              <AnalyticsConfigChart
                chartKeyOrConfig={chartConfig}
                chartContext={chartContext}
                onSelectChartRegion={null}
                renderWithoutPeripherals
              />
            </div>
          </div>
        </ExperienceAnalyticsCurrentAnnotationsBundleContext.Provider>
      </UniverseAnnotationsClientProvider>
    </RAQIV2ClientProvider>
  );
}

// The chart's UserO18Eligibility breakdown legend labels live in the Analytics
// namespace, so load it alongside DevEx (DevEx stays first so the section's bare
// translate() calls keep resolving against it).
export default withTranslation(DevExO18AnalyticsSection, [
  TranslationNamespace.DevEx,
  TranslationNamespace.Analytics,
]);
