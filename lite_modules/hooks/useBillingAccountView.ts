import { NextRouter } from 'next/router';
import { useCallback, useEffect, useMemo } from 'react';

import { AdCreditBalanceScope, parseAdCreditBalanceScopeFromQuery } from '@constants/billing';

interface UseBillingAccountViewParams {
  defaultScopeWhenSwitcherVisible?: AdCreditBalanceScope;
  preferGroupFromLegacyTab?: boolean;
  router: NextRouter;
  /** When false, skip URL sync (e.g. while workspace is still loading). */
  shouldSyncUrl?: boolean;
  showAccountViewSwitcher: boolean;
}

interface UseBillingAccountViewResult {
  accountView: AdCreditBalanceScope;
  changeAccountView: (accountView: AdCreditBalanceScope) => void;
  isGroupAccountView: boolean;
}

const getQueryParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/**
 * Derives personal/group account view from the URL and keeps `balanceScope` in sync.
 */
export const useBillingAccountView = ({
  defaultScopeWhenSwitcherVisible = AdCreditBalanceScope.Group,
  preferGroupFromLegacyTab = false,
  router,
  shouldSyncUrl = true,
  showAccountViewSwitcher,
}: UseBillingAccountViewParams): UseBillingAccountViewResult => {
  const requestedBalanceScope = parseAdCreditBalanceScopeFromQuery(router.query.balanceScope);

  const accountView = useMemo(() => {
    if (!showAccountViewSwitcher) {
      return AdCreditBalanceScope.Personal;
    }
    if (requestedBalanceScope) {
      return requestedBalanceScope;
    }
    if (preferGroupFromLegacyTab) {
      return AdCreditBalanceScope.Group;
    }
    return defaultScopeWhenSwitcherVisible;
  }, [
    defaultScopeWhenSwitcherVisible,
    preferGroupFromLegacyTab,
    requestedBalanceScope,
    showAccountViewSwitcher,
  ]);

  const isGroupAccountView = showAccountViewSwitcher && accountView === AdCreditBalanceScope.Group;

  const changeAccountView = useCallback(
    (nextAccountView: AdCreditBalanceScope) => {
      router.push({
        pathname: router.pathname,
        query: {
          ...router.query,
          balanceScope: nextAccountView,
        },
      });
    },
    [router],
  );

  useEffect(() => {
    if (!router.isReady || !shouldSyncUrl) {
      return;
    }

    const currentBalanceScope = getQueryParam(router.query.balanceScope);

    if (!showAccountViewSwitcher) {
      if (currentBalanceScope === undefined) {
        return;
      }

      const nextQuery = { ...router.query };
      delete nextQuery.balanceScope;
      router.replace({
        pathname: router.pathname,
        query: nextQuery,
      });
      return;
    }

    if (currentBalanceScope === accountView) {
      return;
    }

    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        balanceScope: accountView,
      },
    });
  }, [accountView, router, shouldSyncUrl, showAccountViewSwitcher]);

  return {
    accountView,
    changeAccountView,
    isGroupAccountView,
  };
};
