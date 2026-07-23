import { useEffect, useMemo } from 'react';
import {
  useAnalyticsCurrentDateRangeBundle,
  useAnalyticsCurrentSingleDateBundle,
} from '@modules/charts-generic';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { getClosestAllowedGranularity } from '../../../utils/seriesGranularities';
import { useBestSupportedChartResourceOfTypes } from '../../../hooks/useChartResourceProvider';
import { CreatorAnalyticsPageSurfaceConfig } from '../../../types/RAQIV2PageConfig';
import { snapToLatestEndTime, snapToLatestStartTime } from '../../../utils/snapToLatestTimestep';
import { useAnalyticsCurrentGranularityBundle } from '../../../context/AnalyticsCurrentGranularityProvider';
import legacyFiltersToRAQIV2 from '../../../adapters/legacyFiltersToRAQIV2';
import PageGranularityControl from '../../../layout/ExperienceAnalyticsPageControlBar/PageGranularityControl';
import ExperienceAnalyticsPageBreakdownControl from '../../../layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageBreakdownControl';
import AnalyticsPageAnnotationsControl from '../../../layout/ExperienceAnalyticsPageControlBar/AnalyticsPageAnnotationsControl';
import ExperienceAnalyticsPageSingleDateControl from '../../../layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageSingleDateControl';
import type RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import AnalyticsPageDateRangeControl from '../../../layout/ExperienceAnalyticsPageControlBar/AnalyticsPageDateRangeControl';
import useFilterBreakdownConstraint from '../../../hooks/useFilterBreakdownCorrelation';
import getPageGranularityOptions from '../../../utils/getPageGranularityOptions';
import { getPageSurfaceMetrics } from '../../../utils/getPredefinedComponentMetrics';

const useRAQIV2PredefinedSurfaceControlsBundle = (config: CreatorAnalyticsPageSurfaceConfig) => {
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

  const { startDate: rangeStartDate, endDate: rangeEndDate } = useAnalyticsCurrentDateRangeBundle();
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
      if (!f.isInitialValueOnly && !filter.find((existing) => existing.dimension === f.dimension)) {
        filter.push(f);
      }
    });

    return {
      resource,
      timeSpec: {
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
  }, [defaultFilters, endDate, granularity, legacyFilters, breakdown, resource, startDate]);

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
        />,
      ];
    }
    return [];
  }, [chartContext, granularityOptions, pageGranularityConfig]);

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
    return [
      <AnalyticsPageDateRangeControl
        key='date'
        dateRangeOptions={timeRangeOptions.supportedRanges}
      />,
    ];
  }, [timeRangeOptions, singleDateOptions]);

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
