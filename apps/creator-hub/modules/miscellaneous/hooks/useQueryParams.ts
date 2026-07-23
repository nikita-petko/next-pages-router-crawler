import type { ParsedUrlQuery } from 'node:querystring';
import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';

type TQueryParams<PossibleKeys extends string> = {
  [key in PossibleKeys]: string | string[] | undefined | null;
};
type TQueryParamsInput<PossibleKeys extends string> = {
  [key in PossibleKeys]?:
    | string
    | number
    | boolean
    | Array<string>
    | Array<number>
    | Array<boolean>
    | undefined
    | null;
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

  const lhsValues = Array.isArray(lhs) ? lhs.map((value) => value.toString()) : [lhs.toString()];
  const rhsValues = Array.isArray(rhs) ? rhs.map((value) => value.toString()) : [rhs.toString()];

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
  const queryParamValues = useMemo(() => {
    return queryParamKeys.reduce((result, key) => ({ ...result, [key]: router.query[key] }), {});
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
        router.replace({
          pathname: router.pathname,
          query: newQuery,
        });
      } else {
        router.push(
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

  return [queryParamValues as TQueryParams<T>, setQueryParamValues];
};

export default useQueryParams;
