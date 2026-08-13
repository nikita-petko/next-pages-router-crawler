import type { ParsedUrlQuery } from 'node:querystring';
import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';

export type TQueryParamValue = string | string[] | undefined | null;
export type TQueryParamInputValue =
  | string
  | number
  | boolean
  | Array<string>
  | Array<number>
  | Array<boolean>
  | undefined
  | null;

export type TQueryParams<PossibleKeys extends string> = Partial<
  Record<PossibleKeys, TQueryParamValue>
>;
export type TQueryParamsInput<PossibleKeys extends string> = {
  [key in PossibleKeys]?: TQueryParamInputValue;
};

export const normalizeSingleQueryParam = (value: TQueryParamValue): string | undefined => {
  const single = Array.isArray(value) ? value[0] : value;
  return single === '' || single == null ? undefined : single;
};

const isQueryValueEquivalent = (
  lhs: string | string[] | undefined,
  rhs: string | string[] | undefined,
): boolean => {
  if (lhs == null && rhs == null) {
    return true;
  }
  if (lhs == null || rhs == null) {
    return false;
  }

  const lhsValues = Array.isArray(lhs) ? lhs : [lhs];
  const rhsValues = Array.isArray(rhs) ? rhs : [rhs];

  if (lhsValues.length !== rhsValues.length) {
    return false;
  }

  return lhsValues.every((value, idx) => value === rhsValues[idx]);
};

const isQueryEquivalent = (lhs: ParsedUrlQuery, rhs: ParsedUrlQuery): boolean => {
  const allKeys = new Set([...Object.keys(lhs), ...Object.keys(rhs)]);
  return Array.from(allKeys).every((key) => isQueryValueEquivalent(lhs[key], rhs[key]));
};

/**
 * Get and update URL query params through NextJS router
 * @param queryParamKeys: Array<string>
 */
const useQueryParams = <T extends string>(
  queryParamKeys: ReadonlyArray<T>,
  transitionOptions?: { scroll?: boolean },
): [
  TQueryParams<T>,
  (values: TQueryParamsInput<T>, options?: { skipHistory: boolean }) => void,
] => {
  const router = useRouter();
  const queryParamValues = useMemo<TQueryParams<T>>(() => {
    const result: TQueryParams<T> = {};
    for (const key of queryParamKeys) {
      result[key] = router.query[key];
    }
    return result;
  }, [queryParamKeys, router.query]);

  const setQueryParamValues = useCallback(
    (newParamValues: TQueryParamsInput<T>, options = { skipHistory: false }) => {
      const newQuery = { ...router.query };

      queryParamKeys.forEach((key) => {
        if (!Object.hasOwn(newParamValues, key)) {
          return;
        }
        const value = newParamValues[key];
        if (value == null) {
          delete newQuery[key];
        } else if (Array.isArray(value)) {
          newQuery[key] = value.map((v) => v.toString());
        } else {
          newQuery[key] = value.toString();
        }
      });

      if (isQueryEquivalent(router.query, newQuery)) {
        return;
      }

      if (options.skipHistory) {
        void router.replace({
          pathname: router.pathname,
          query: newQuery,
        });
      } else {
        void router.push(
          {
            pathname: router.pathname,
            query: newQuery,
          },
          undefined,
          transitionOptions,
        );
      }
    },
    [router, queryParamKeys, transitionOptions],
  );

  return [queryParamValues, setQueryParamValues];
};

export default useQueryParams;
