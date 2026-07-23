/**
 * Layer 2: Page Config Aware Date Range Provider
 *
 * This provider consumes raw query params from Layer 1 and applies page-config-based defaults.
 * It provides the same context type as the existing AnalyticsQueryDateRangeBundleContext.
 */

import React, { FC, useMemo, useCallback } from 'react';
import {
  AnalyticsQueryDateRangeBundleContext,
  DateRangeType,
  getMinDate,
  laterDate,
  AnalyticsDateRangeBundle,
} from '@modules/charts-generic';
import { useRawAnalyticsQueryParams } from '../rawQueryParams';
import { CreatorAnalyticsPageSurfaceConfig, EndDateBehavior } from '../../types/RAQIV2PageConfig';
import { calculateDatesFromRangeType, getSafeDefaultRange } from '../../utils/dateRangeUtils';
import useMetricLatestAvailableTime from '../../hooks/useMetricLatestAvailableTime';
import getPredefinedComponentMetrics from '../../utils/getPredefinedComponentMetrics';

type PageConfigAwareDateRangeProviderProps = {
  children: React.ReactNode;
  config: CreatorAnalyticsPageSurfaceConfig;
};

type DateRangeConfig = {
  supportedRanges: DateRangeType[];
  defaultRange: DateRangeType;
  minStartDate?: Date;
  maxStartDateOffsetDays?: number;
  maxRangeDays?: number;
};

/**
 * Build date range config from the page surface config's timeRangeOptions.
 */
function buildDateRangeConfig(
  config: CreatorAnalyticsPageSurfaceConfig,
): DateRangeConfig | undefined {
  const { timeRangeOptions } = config;

  if (timeRangeOptions.type === 'None' || timeRangeOptions.type === 'singleDay') {
    return undefined;
  }

  return {
    supportedRanges: timeRangeOptions.supportedRanges,
    defaultRange: timeRangeOptions.defaultRange ?? DateRangeType.Last28Days,
    minStartDate: timeRangeOptions.minStartDate,
    maxStartDateOffsetDays: timeRangeOptions.maxStartDateOffsetDays,
    maxRangeDays: timeRangeOptions.maxRangeDays,
  };
}

/**
 * Calculate date range bounds based on config and current date.
 */
function calculateDateRangeBounds(config: DateRangeConfig | undefined, maxEndDateOverride?: Date) {
  const maxEndDate = maxEndDateOverride ?? new Date();

  // Min start date calculation
  let minStartDate: Date;
  if (config?.minStartDate && config?.maxStartDateOffsetDays) {
    const offsetDate = getMinDate(config.maxStartDateOffsetDays);
    minStartDate = laterDate(config.minStartDate, offsetDate);
  } else if (config?.minStartDate) {
    minStartDate = config.minStartDate;
  } else if (config?.maxStartDateOffsetDays) {
    minStartDate = getMinDate(config.maxStartDateOffsetDays);
  } else {
    // Default to 1 year ago
    minStartDate = getMinDate(365);
  }

  return { minStartDate, maxEndDate };
}

export const PageConfigAwareDateRangeProvider: FC<PageConfigAwareDateRangeProviderProps> = ({
  children,
  config,
}) => {
  const rawParams = useRawAnalyticsQueryParams();

  // Build date range config from surface config
  const dateRangeConfig = useMemo(() => buildDateRangeConfig(config), [config]);

  // Query for latest available time when configured to do so
  const shouldQueryLatestAvailable =
    config.endDateBehavior === EndDateBehavior.LatestAvailableForMetrics;

  const metrics = useMemo(
    () => (shouldQueryLatestAvailable ? config.body.map(getPredefinedComponentMetrics).flat() : []),
    [config.body, shouldQueryLatestAvailable],
  );

  const { data: latestAvailableTime } = useMetricLatestAvailableTime(
    metrics,
    !shouldQueryLatestAvailable,
  );

  const maxEndDateOverride = shouldQueryLatestAvailable ? latestAvailableTime : undefined;

  // Calculate bounds
  const { minStartDate, maxEndDate } = useMemo(
    () => calculateDateRangeBounds(dateRangeConfig, maxEndDateOverride),
    [dateRangeConfig, maxEndDateOverride],
  );

  // Determine effective range type with defaulting
  const rangeType = useMemo<DateRangeType>(() => {
    const rawRangeType = rawParams.rangeType;
    const supportedRanges = dateRangeConfig?.supportedRanges;
    const defaultRange = dateRangeConfig?.defaultRange;

    // If not set, use safe default from supported ranges
    if (!rawRangeType) {
      return getSafeDefaultRange(supportedRanges, defaultRange);
    }

    // If set but not supported, use safe default
    if (supportedRanges && !supportedRanges.includes(rawRangeType)) {
      return getSafeDefaultRange(supportedRanges, defaultRange);
    }

    return rawRangeType;
  }, [rawParams.rangeType, dateRangeConfig]);

  // Calculate dates
  const { startDate, endDate } = useMemo(() => {
    return calculateDatesFromRangeType(
      rangeType,
      rawParams.minTime,
      rawParams.maxTime,
      maxEndDate,
      minStartDate,
      dateRangeConfig?.maxRangeDays,
    );
  }, [
    rangeType,
    rawParams.minTime,
    rawParams.maxTime,
    maxEndDate,
    minStartDate,
    dateRangeConfig?.maxRangeDays,
  ]);

  // Create callbacks that use raw setters
  const onChangeRangeType = useCallback(
    (type: DateRangeType) => {
      rawParams.setRangeType(type);
    },
    [rawParams],
  );

  const onChangeDateRangeParams = useCallback(
    (minDate: Date | null, maxDate: Date | null, type: DateRangeType) => {
      rawParams.setDateRangeParams(
        minDate ? minDate.getTime() : null,
        maxDate ? maxDate.getTime() : null,
        type,
      );
    },
    [rawParams],
  );

  const bundle = useMemo<AnalyticsDateRangeBundle>(
    () => ({
      startDate,
      endDate,
      minStartDate,
      maxEndDate,
      rangeType,
      onChangeRangeType,
      onChangeDateRangeParams,
      maxRangeDays: dateRangeConfig?.maxRangeDays,
    }),
    [
      startDate,
      endDate,
      minStartDate,
      maxEndDate,
      rangeType,
      onChangeRangeType,
      onChangeDateRangeParams,
      dateRangeConfig?.maxRangeDays,
    ],
  );

  return (
    <AnalyticsQueryDateRangeBundleContext.Provider value={bundle}>
      {children}
    </AnalyticsQueryDateRangeBundleContext.Provider>
  );
};

export default PageConfigAwareDateRangeProvider;
