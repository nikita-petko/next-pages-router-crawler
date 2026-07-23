import { useCallback, useEffect, useMemo } from 'react';
import type AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import { useQueryParams } from '@modules/miscellaneous/hooks';

// TODO: Move type exports to useQueryParams?
export type TQueryParamResult = string | string[] | undefined | null;
type TQueryParamInput =
  | string
  | number
  | boolean
  | Array<string>
  | Array<number>
  | Array<boolean>
  | undefined
  | null;

function useQueryBasedAnalyticsBundle<TCurrentValue>({
  current,
  legacy,
  log,
}: {
  current: {
    key: AnalyticsQueryParams;
    parse: (value: TQueryParamResult) => TCurrentValue;
    serialize: (value: TCurrentValue) => TQueryParamInput;
  };
  legacy: {
    key: AnalyticsQueryParams;
    parseAndMigrate: (value: TQueryParamResult) => TCurrentValue | null;
    shouldUpgrade: (current: TCurrentValue, legacy: TCurrentValue) => boolean;
  };
  log: (oldValue: TCurrentValue, newValue: TCurrentValue) => void;
}): {
  value: TCurrentValue;
  setValue: (value: TCurrentValue) => void;
} {
  const queryKeys = useMemo(() => [current.key, legacy.key], [current.key, legacy.key]);

  const [queryParams, setQueryParams] = useQueryParams(queryKeys);
  const setCurrentQueryParam = useCallback(
    (value: TCurrentValue) => {
      setQueryParams({ [current.key]: current.serialize(value) });
    },
    [current, setQueryParams],
  );
  const clearLegacyQueryParam = useCallback(() => {
    setQueryParams({ [legacy.key]: null });
  }, [legacy, setQueryParams]);

  const currentFromQuery = useMemo(
    () => current.parse(queryParams[current.key]),
    [current, queryParams],
  );

  const migratedLegacyFromQuery = useMemo(
    () => legacy.parseAndMigrate(queryParams[legacy.key]),
    [legacy, queryParams],
  );

  useEffect(() => {
    if (
      migratedLegacyFromQuery !== null &&
      legacy.shouldUpgrade(currentFromQuery, migratedLegacyFromQuery)
    ) {
      setCurrentQueryParam(migratedLegacyFromQuery);
    }
    if (queryParams[legacy.key]) {
      clearLegacyQueryParam();
    }
  }, [
    clearLegacyQueryParam,
    current,
    currentFromQuery,
    legacy,
    migratedLegacyFromQuery,
    queryParams,
    setCurrentQueryParam,
  ]);

  return {
    value: currentFromQuery,
    setValue: (value: TCurrentValue) => {
      const oldValue = currentFromQuery;
      log(oldValue, value);
      setCurrentQueryParam(value);
    },
  };
}
export default useQueryBasedAnalyticsBundle;
