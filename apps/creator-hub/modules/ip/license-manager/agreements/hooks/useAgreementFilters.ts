import { useMemo, useCallback } from 'react';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import useGetAgreementCounts from './useGetAgreementCounts';
import { creatorAgreementTabsConfig } from '../../creatorAgreements/CreatorAgreementsContainer';
import { iphAgreementFiltersConfig } from '../components/AgreementTableFilters';
import { AgreementFilterKeys } from '../utils/constants';

const TAB_QUERY_PARAM = 'tab' as const;

const VALID_TAB_KEYS = new Set(Object.values(AgreementFilterKeys));

const useGetAgreementFilters = (isCreator?: boolean) => {
  const [queryParams, setQueryParams] = useQueryParams([TAB_QUERY_PARAM], { scroll: false });

  // Only use the tab param if it's a valid filter key
  const tabParam = typeof queryParams.tab === 'string' ? queryParams.tab : undefined;
  const userSelectedFilter =
    tabParam && VALID_TAB_KEYS.has(tabParam as AgreementFilterKeys) ? tabParam : undefined;

  const setUserSelectedFilter = useCallback(
    (filter: string | undefined) => {
      setQueryParams({ tab: filter }, { skipHistory: false });
    },
    [setQueryParams],
  );

  const tabsConfig = isCreator ? creatorAgreementTabsConfig : iphAgreementFiltersConfig;

  const countsQuery = useGetAgreementCounts(
    isCreator ?? false,
    tabsConfig.map((tab) => tab.keyName as AgreementFilterKeys),
  );

  const filtersWithCounts = useMemo(() => {
    const config = tabsConfig;
    return config.map((filter) => {
      const count = countsQuery.data?.get(filter.keyName as AgreementFilterKeys) || 0;
      return {
        ...filter,
        count,
      };
    });
  }, [tabsConfig, countsQuery.data]);

  const effectiveSelectedFilter = useMemo(() => {
    // If user has explicitly selected a filter, use that
    if (userSelectedFilter !== undefined) {
      return userSelectedFilter;
    }

    // If data isn't loaded yet, no selection
    if (!countsQuery.data) {
      return undefined;
    }

    // If the user hasn't selected a filter, then pre-select one for them by
    // finding the first non-zero filter (excluding inactive agreements)
    const firstNonZeroFilter = filtersWithCounts.find(
      (filter) => filter.count > 0 && filter.keyName !== AgreementFilterKeys.Inactive,
    );

    if (firstNonZeroFilter) {
      return firstNonZeroFilter.keyName;
    }

    // If all filters have zero count, default to the requests filter for Creator, or offers filter for IPH
    return isCreator ? AgreementFilterKeys.Requests : AgreementFilterKeys.Offers;
  }, [isCreator, userSelectedFilter, countsQuery.data, filtersWithCounts]);

  return {
    filtersWithCounts,
    effectiveSelectedFilter,
    userSelectedFilter,
    setUserSelectedFilter,
    countsQuery,
  };
};

export default useGetAgreementFilters;
