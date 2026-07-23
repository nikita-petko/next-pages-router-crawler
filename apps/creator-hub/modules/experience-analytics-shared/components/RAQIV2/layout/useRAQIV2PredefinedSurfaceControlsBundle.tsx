import { useEffect, useMemo } from 'react';
import { RAQIV2DateRangeType, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import { useAnalyticsCurrentSingleDateBundle } from '@modules/charts-generic/context/AnalyticsQuerySingleDateBundleContext';
import legacyFiltersToRAQIV2 from '../../../adapters/legacyFiltersToRAQIV2';
import { useAnalyticsCurrentGranularityBundle } from '../../../context/AnalyticsCurrentGranularityProvider';
import { useBestSupportedChartResourceOfTypes } from '../../../hooks/useChartResourceProvider';
import useFilterBreakdownConstraint from '../../../hooks/useFilterBreakdownCorrelation';
import AnalyticsPageAnnotationsControl from '../../../layout/ExperienceAnalyticsPageControlBar/AnalyticsPageAnnotationsControl';
import AnalyticsPageDateRangeControl from '../../../layout/ExperienceAnalyticsPageControlBar/AnalyticsPageDateRangeControl';
import ExperienceAnalyticsPageBreakdownControl from '../../../layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageBreakdownControl';
import ExperienceAnalyticsPageSingleDateControl from '../../../layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageSingleDateControl';
import PageGranularityControl from '../../../layout/ExperienceAnalyticsPageControlBar/PageGranularityControl';
import type RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import type { CreatorAnalyticsPageSurfaceConfig } from '../../../types/RAQIV2PageConfig';
import getPageGranularityOptions from '../../../utils/getPageGranularityOptions';
import { getPageSurfaceMetrics } from '../../../utils/getPredefinedComponentMetrics';
import { getClosestAllowedGranularity } from '../../../utils/seriesGranularities';
import { snapToLatestEndTime, snapToLatestStartTime } from '../../../utils/snapToLatestTimestep';
import ChartConfiguratorDateRangeControl from '../../chartConfigurator/components/ChartConfiguratorDateRangeControl';

type UseRAQIV2PredefinedSurfaceControlsBundleOptions = {
  readonly useFoundationDateRangeControl?: boolean;
  readonly hidePartialGranularitySupportDescription?: boolean;
};

const useRAQIV2PredefinedSurfaceControlsBundle = (
  config: CreatorAnalyticsPageSurfaceConfig,
  options: UseRAQIV2PredefinedSurfaceControlsBundleOptions = {},
) => {
  const {
    resourceTypes,
    granularity: pageGranularityConfig,
    timeRangeOptions,
    filterDimensions: allowableFilterDimensions,
    breakdownDimensions: allowableBreakdownDimensions,
    defaultBreakdown,
    defaultFilters,
    surfaceAnnotationOptions: { showAnnotationsControl },
    body,
  } = config;

  const resource = useBestSupportedChartResourceOfTypes(resourceTypes);

  const {
    startDate: rangeStartDate,
    endDate: rangeEndDate,
    rangeType,
  } = useAnalyticsCurrentDateRangeBundle();
  const { date: singleDate, singleDateOptions } = useAnalyticsCurrentSingleDateBundle();
  const { startDate, endDate } = useMemo(() => {
    if (timeRangeOptions.type === 'singleDay') {
      return {
        startDate: snapToLatestStartTime(singleDate, RAQIV2MetricGranularity.OneDay),
        endDate: snapToLatestEndTime(singleDate, RAQIV2MetricGranularity.OneDay),
      };
    }
    return { startDate: rangeStartDate, endDate: rangeEndDate };
  }, [timeRangeOptions, rangeEndDate, rangeStartDate, singleDate]);
  const timeSpecRangeType =
    timeRangeOptions.type === 'singleDay' ? RAQIV2DateRangeType.Custom : rangeType;

  const { granularity: pageGranularityFromQueryOrDefault, onChangeGranularity } =
    useAnalyticsCurrentGranularityBundle();

  const { breakdown, filter: legacyFilters } = useFilterBreakdownConstraint({
    allowableBreakdownDimensions,
    defaultBreakdown,
    allowableFilterDimensions,
    defaultFilters,
  });

  const pageMetrics = useMemo(() => getPageSurfaceMetrics(body), [body]);

  const granularityOptions = useMemo(
    () =>
      getPageGranularityOptions({
        metrics: pageMetrics,
        startDate,
        endDate,
        breakdown,
        configOptions:
          pageGranularityConfig && 'options' in pageGranularityConfig
            ? pageGranularityConfig.options
            : undefined,
        configConstraints:
          pageGranularityConfig && 'options' in pageGranularityConfig
            ? pageGranularityConfig.constraints
            : undefined,
      }),
    [pageMetrics, startDate, endDate, breakdown, pageGranularityConfig],
  );

  const supportedGranularities = useMemo(
    () => granularityOptions.filter((o) => o.isAllowed).map((o) => o.granularity),
    [granularityOptions],
  );

  const granularity: RAQIV2MetricGranularity = useMemo(() => {
    if (pageGranularityConfig && 'fixed' in pageGranularityConfig) {
      return pageGranularityConfig.fixed;
    }

    return getClosestAllowedGranularity({
      startDate,
      endDate,
      granularity: pageGranularityFromQueryOrDefault,
      supportedGranularities,
    });
  }, [
    pageGranularityConfig,
    startDate,
    endDate,
    pageGranularityFromQueryOrDefault,
    supportedGranularities,
  ]);

  useEffect(() => {
    if (granularity !== pageGranularityFromQueryOrDefault) {
      onChangeGranularity(granularity);
    }
  }, [granularity, pageGranularityFromQueryOrDefault, onChangeGranularity]);

  const chartContext: RAQIV2ChartContext = useMemo(() => {
    const filter = legacyFiltersToRAQIV2(legacyFilters);
    defaultFilters?.forEach((f) => {
      if (!f.isInitialValueOnly && !filter.some((existing) => existing.dimension === f.dimension)) {
        filter.push(f);
      }
    });

    return {
      resource,
      timeSpec: {
        rangeType: timeSpecRangeType,
        startTime: startDate,
        endTime: endDate,
      },
      granularity,
      filter,
      breakdown,
      timeAxisBounds: [
        snapToLatestStartTime(startDate, granularity),
        snapToLatestEndTime(endDate, granularity),
      ],
    };
  }, [
    defaultFilters,
    endDate,
    granularity,
    legacyFilters,
    breakdown,
    resource,
    startDate,
    timeSpecRangeType,
  ]);

  const granularityControls = useMemo(() => {
    if (pageGranularityConfig && 'fixed' in pageGranularityConfig) {
      return [];
    }
    if (granularityOptions.length) {
      return [
        <PageGranularityControl
          key='granularity'
          options={granularityOptions}
          chartContext={chartContext}
          hidePartialSupportDescription={options.hidePartialGranularitySupportDescription}
        />,
      ];
    }
    return [];
  }, [
    chartContext,
    granularityOptions,
    options.hidePartialGranularitySupportDescription,
    pageGranularityConfig,
  ]);

  const breakdownControls = useMemo(() => {
    if (allowableBreakdownDimensions.length > 0) {
      return [
        <ExperienceAnalyticsPageBreakdownControl
          key='breakdown'
          dimensions={allowableBreakdownDimensions}
        />,
      ];
    }
    return [];
  }, [allowableBreakdownDimensions]);

  const rightSideControls = useMemo(() => {
    return [
      ...breakdownControls,
      ...granularityControls,
      ...(showAnnotationsControl
        ? [<AnalyticsPageAnnotationsControl key='annotations' resourceType={resource.type} />]
        : []),
    ];
  }, [breakdownControls, granularityControls, resource, showAnnotationsControl]);

  const leftSideControls = useMemo(() => {
    if (timeRangeOptions.type === 'None') {
      return [];
    }
    if (timeRangeOptions.type === 'singleDay') {
      return [
        <ExperienceAnalyticsPageSingleDateControl
          key='date'
          singleDateOptions={singleDateOptions}
        />,
      ];
    }
    if (options.useFoundationDateRangeControl) {
      return [
        <ChartConfiguratorDateRangeControl
          key='date'
          dateRangeOptions={timeRangeOptions.supportedRanges}
        />,
      ];
    }
    return [
      <AnalyticsPageDateRangeControl
        key='date'
        dateRangeOptions={timeRangeOptions.supportedRanges}
      />,
    ];
  }, [options.useFoundationDateRangeControl, timeRangeOptions, singleDateOptions]);

  const filterDimensions = useMemo(() => {
    return allowableFilterDimensions;
  }, [allowableFilterDimensions]);

  return useMemo(
    () => ({
      leftSideControls,
      rightSideControls,
      filterDimensions,
      chartContext,
    }),
    [leftSideControls, rightSideControls, filterDimensions, chartContext],
  );
};

export default useRAQIV2PredefinedSurfaceControlsBundle;
