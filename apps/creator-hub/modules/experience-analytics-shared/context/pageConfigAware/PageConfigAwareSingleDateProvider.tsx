/**
 * Layer 2: Page Config Aware Single Date Provider
 *
 * This provider consumes raw query params from Layer 1 and applies page-config-based defaults
 * for single date selection. It provides the same context type as AnalyticsQuerySingleDateBundleContext.
 */

import type { FC } from 'react';
import React, { useMemo, useCallback } from 'react';
import { subDays } from '@rbx/core';
import singleDateOffsetDays from '@modules/charts-generic/constants/singleDateOffsetDays';
import AnalyticsQuerySingleDateBundleContext from '@modules/charts-generic/context/AnalyticsQuerySingleDateBundleContext';
import SingleDateType from '@modules/charts-generic/enums/SingleDateType';
import { minimalDateForQuerying } from '../../constants/analyticsMetadata';
import type { CreatorAnalyticsPageSurfaceConfig } from '../../types/RAQIV2PageConfig';
import { useRawAnalyticsQueryParams } from '../rawQueryParams/RawAnalyticsQueryParamsProvider';

type PageConfigAwareSingleDateProviderProps = {
  children: React.ReactNode;
  config: CreatorAnalyticsPageSurfaceConfig;
};

type SingleDateConfig = {
  supportedDates: SingleDateType[];
  defaultDate: SingleDateType;
  maxEndDateOffset?: number;
};

const defaultSingleDateConfig: SingleDateConfig = {
  supportedDates: [SingleDateType.MostRecent],
  defaultDate: SingleDateType.MostRecent,
  maxEndDateOffset: 2,
};

/**
 * Get the effective single date type with defaulting.
 */
function getEffectiveSingleDateType(
  rawSingleDateType: string | undefined,
  singleDateConfig: SingleDateConfig,
): SingleDateType {
  if (!rawSingleDateType) {
    return singleDateConfig.defaultDate;
  }

  // Check if the raw value is a valid SingleDateType
  const isValidType = Object.values(SingleDateType).includes(rawSingleDateType as SingleDateType);
  if (!isValidType) {
    return singleDateConfig.defaultDate;
  }

  const typedValue = rawSingleDateType as SingleDateType;

  // Check if it's supported
  if (!singleDateConfig.supportedDates.includes(typedValue)) {
    return singleDateConfig.defaultDate;
  }

  return typedValue;
}

/**
 * Calculate the effective date based on single date type and raw timestamp.
 */
function calculateDate(
  singleDateType: SingleDateType,
  rawDateTime: number | undefined,
  maxEndDate: Date,
  minStartDate: Date,
): Date {
  // For relative date types (non-Custom), calculate based on offset from maxEndDate
  if (singleDateOffsetDays[singleDateType] !== 0) {
    const relativeDateOffset = singleDateOffsetDays[singleDateType] - 1;
    return subDays(maxEndDate, relativeDateOffset);
  }

  // For Custom type, use the raw timestamp if valid
  if (rawDateTime !== undefined) {
    const rawDate = new Date(rawDateTime);
    if (rawDate.getTime() >= minStartDate.getTime() && rawDate.getTime() <= maxEndDate.getTime()) {
      return rawDate;
    }
  }

  // Default to maxEndDate if no valid custom date
  return maxEndDate;
}

export const PageConfigAwareSingleDateProvider: FC<PageConfigAwareSingleDateProviderProps> = ({
  children,
  config,
}) => {
  const rawParams = useRawAnalyticsQueryParams();

  // Build single date config from the page surface config
  const singleDateConfig = useMemo(() => {
    const { timeRangeOptions } = config;
    if (timeRangeOptions.type === 'singleDay') {
      return {
        supportedDates: timeRangeOptions.supportedDates,
        defaultDate: timeRangeOptions.defaultDate,
        maxEndDateOffset: timeRangeOptions.maxEndDateOffset ?? 2,
      };
    }
    return defaultSingleDateConfig;
  }, [config]);

  // Calculate date bounds
  const minStartDate = useMemo(() => minimalDateForQuerying, []);
  const maxEndDate = useMemo(() => {
    const now = new Date();
    const offset = singleDateConfig.maxEndDateOffset ?? 0;
    return offset > 0 ? subDays(now, offset) : now;
  }, [singleDateConfig.maxEndDateOffset]);

  // Determine effective single date type
  const singleDateType = useMemo<SingleDateType>(
    () => getEffectiveSingleDateType(rawParams.singleDateType, singleDateConfig),
    [rawParams.singleDateType, singleDateConfig],
  );

  // Calculate the effective date
  const date = useMemo(
    () => calculateDate(singleDateType, rawParams.singleDateTime, maxEndDate, minStartDate),
    [singleDateType, rawParams.singleDateTime, maxEndDate, minStartDate],
  );

  // Create callbacks that use raw setters
  const onChangeDateType = useCallback(
    (newDateType: SingleDateType) => {
      rawParams.setSingleDate(newDateType, null);
    },
    [rawParams],
  );

  const onChangeDate = useCallback(
    async (newDate: Date | null) => {
      if (newDate == null) {
        return;
      }
      rawParams.setSingleDate(SingleDateType.Custom, newDate.getTime());
    },
    [rawParams],
  );

  const bundle = useMemo(
    () => ({
      date,
      onChangeDate,
      maxEndDate,
      minStartDate,
      singleDateType,
      onChangeDateType,
      singleDateOptions: singleDateConfig.supportedDates,
    }),
    [
      date,
      onChangeDate,
      maxEndDate,
      minStartDate,
      singleDateType,
      onChangeDateType,
      singleDateConfig.supportedDates,
    ],
  );

  return (
    <AnalyticsQuerySingleDateBundleContext.Provider value={bundle}>
      {children}
    </AnalyticsQuerySingleDateBundleContext.Provider>
  );
};

export default PageConfigAwareSingleDateProvider;
