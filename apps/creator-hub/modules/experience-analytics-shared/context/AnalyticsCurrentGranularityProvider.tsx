import React, { createContext, FC, useContext, useMemo, useCallback } from 'react';
import {
  AnalyticsQueryParams,
  AnalyticsQueryDateRangeBundleContext,
} from '@modules/charts-generic';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import {
  TUIGranularity,
  getClosestAllowedGranularity,
  getSeriesDefaultGranularity,
} from '../utils/seriesGranularities';
import { logGranularityChange } from '../logging/experienceAnalyticsUnifiedLogger';
import { LoggingTarget } from '../logging/LoggingTarget';
import emptyFunction from '../emptyFunction';

type AnalyticsCurrentGranularityBundle = {
  granularity: TUIGranularity;
  onChangeGranularity: (granularity: TUIGranularity) => void;
};

export const DefaultAnalyticsCurrentGranularityBundle: AnalyticsCurrentGranularityBundle = {
  granularity: RAQIV2MetricGranularity.OneHour,
  onChangeGranularity: emptyFunction,
};

export const AnalyticsCurrentGranularityBundleContext =
  createContext<AnalyticsCurrentGranularityBundle>(DefaultAnalyticsCurrentGranularityBundle);
AnalyticsCurrentGranularityBundleContext.displayName = 'AnalyticsCurrentGranularityBundleContext';

export type AnalyticsCurrentGranularityProviderSpec = {
  loggingTarget?: LoggingTarget;
};

// This is to be a superset of LegacyPageGranularity, which will be deleted
export enum QueryParamGranularity {
  Weekly = 'Weekly',
  Daily = 'Daily',
  Hourly = 'Hourly',
  Minutely = 'Minutely',
  ThirtyMinutely = 'ThirtyMinutely',
  Cumulative = 'Cumulative',
  Monthly = 'Monthly',
}

const queryGranularityToUIGranularity: Record<QueryParamGranularity, TUIGranularity> = {
  [QueryParamGranularity.Monthly]: RAQIV2MetricGranularity.OneMonth,
  [QueryParamGranularity.Weekly]: RAQIV2MetricGranularity.OneWeek,
  [QueryParamGranularity.Daily]: RAQIV2MetricGranularity.OneDay,
  [QueryParamGranularity.Hourly]: RAQIV2MetricGranularity.OneHour,
  [QueryParamGranularity.Minutely]: RAQIV2MetricGranularity.OneMinute,
  [QueryParamGranularity.ThirtyMinutely]: RAQIV2MetricGranularity.HalfHour,
  [QueryParamGranularity.Cumulative]: RAQIV2MetricGranularity.None,
};

export const uiGranularityToQueryGranularity: Record<TUIGranularity, QueryParamGranularity> = {
  [RAQIV2MetricGranularity.OneMonth]: QueryParamGranularity.Monthly,
  [RAQIV2MetricGranularity.OneWeek]: QueryParamGranularity.Weekly,
  [RAQIV2MetricGranularity.OneDay]: QueryParamGranularity.Daily,
  [RAQIV2MetricGranularity.OneHour]: QueryParamGranularity.Hourly,
  [RAQIV2MetricGranularity.HalfHour]: QueryParamGranularity.ThirtyMinutely,
  [RAQIV2MetricGranularity.OneMinute]: QueryParamGranularity.Minutely,
  [RAQIV2MetricGranularity.None]: QueryParamGranularity.Cumulative,
};

const AnalyticsCurrentGranularityProvider: FC<
  React.PropsWithChildren<AnalyticsCurrentGranularityProviderSpec>
> = ({ children, loggingTarget }) => {
  const [{ granularity: queryRawGranularity }, setQueryParamValues] = useQueryParams([
    AnalyticsQueryParams.Granularity,
  ]);

  const queryGranularity = useMemo(() => {
    if (typeof queryRawGranularity !== 'string') return null;
    if (isValidEnumValue(QueryParamGranularity, queryRawGranularity)) {
      return queryGranularityToUIGranularity[queryRawGranularity];
    }
    return null;
  }, [queryRawGranularity]);

  const { startDate, endDate } = useContext(AnalyticsQueryDateRangeBundleContext);
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const granularity = useMemo(() => {
    if (!queryGranularity) return getSeriesDefaultGranularity(startDate, endDate);
    return getClosestAllowedGranularity({
      startDate,
      endDate,
      granularity: queryGranularity,
    });
  }, [endDate, queryGranularity, startDate]);

  const onChangeGranularity = useCallback(
    (newGranularity: TUIGranularity) => {
      const newQueryGranularity = uiGranularityToQueryGranularity[newGranularity];
      setQueryParamValues({ granularity: newQueryGranularity });
      logGranularityChange(unifiedLogger, { loggingTarget, newGranularity: newQueryGranularity });
    },
    [loggingTarget, setQueryParamValues, unifiedLogger],
  );

  const wrapper = useMemo(() => {
    return {
      granularity,
      onChangeGranularity,
    };
  }, [granularity, onChangeGranularity]);
  return (
    <AnalyticsCurrentGranularityBundleContext.Provider value={wrapper}>
      {children}
    </AnalyticsCurrentGranularityBundleContext.Provider>
  );
};

export const useAnalyticsCurrentGranularityNullable = (): TUIGranularity | null => {
  const result = useContext(AnalyticsCurrentGranularityBundleContext);
  if (!result) return null;
  return result.granularity;
};

export const useAnalyticsCurrentGranularityBundle = (): AnalyticsCurrentGranularityBundle => {
  const bundle = useContext(AnalyticsCurrentGranularityBundleContext);
  if (!bundle) {
    throw new Error('Must be within an AnalyticsCurrentGranularityBundleContext');
  }
  return bundle;
};

export default AnalyticsCurrentGranularityProvider;
