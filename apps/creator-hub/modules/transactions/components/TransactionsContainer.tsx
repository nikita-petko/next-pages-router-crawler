import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { HubMeta, buildTitle } from '@rbx/creator-hub-history';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Divider, Grid, Tab, Tabs } from '@rbx/ui';
import MarketplaceFiatServiceProvider from '@modules/marketplaceFiatService/MarketplaceFiatServiceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { www } from '@modules/miscellaneous/urls';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import CreatorStoreTransactions from '../creatorStore/components/CreatorStoreTransactions';
import PaidAccessTransactions from '../paidAccess/components/PaidAccessTransactions/PaidAccessTransactions';
import type { TransactionTabType } from '../types';
import { TransactionTab } from '../types';
import VirtualTransactions from '../virtualTransactions/components/VirtualTransactions';
import useTransactionContainerStyles from './TransactionsContainer.styles';

export interface TransactionsContainerProps {
  tabs: TransactionTabType[];
}

// String-enum values widen to `string[]` via annotation (no assertion), so an arbitrary string
// can be membership-tested without an unsafe cast or an enum-vs-string comparison.
const TRANSACTION_TAB_VALUES: string[] = Object.values(TransactionTab);

const isTransactionTab = (value: string): value is TransactionTab =>
  TRANSACTION_TAB_VALUES.includes(value);

const TransactionsContainer: FunctionComponent<
  React.PropsWithChildren<TransactionsContainerProps>
> = ({ tabs }) => {
  const currentGroup = useCurrentGroup();
  const { translate } = useTranslation();
  const { classes: styles, cx } = useTransactionContainerStyles();
  const router = useRouter();
  const {
    query: { tab: urlQueryTab, paymentType: urlPaymentType },
  } = router;

  // The `tab` query param carries a TransactionTab *value* (e.g. 'store'), so match it against
  // the enum values. It must also be one of the currently-available `tabs`: a gated tab (e.g.
  // `virtual` when its flag is off) is absent from `tabs`, so `?tab=virtual` must not select it.
  const initialTab =
    typeof urlQueryTab === 'string' &&
    isTransactionTab(urlQueryTab) &&
    tabs.some((tab) => tab.key === urlQueryTab)
      ? urlQueryTab
      : null;
  // `paymentType` is a Creator Store-only param written to the URL without a `?tab=`, so treat its
  // presence as an implicit Creator Store selection — otherwise a refresh with only `?paymentType=`
  // falls through to the default (first) tab, which is Virtual when the flag is on, silently
  // dropping the payment type.
  const paymentTypeImpliedTab =
    typeof urlPaymentType === 'string' ? TransactionTab.CreatorStore : null;
  const [activeTab, setActiveTab] = useState<TransactionTab>(
    initialTab ?? paymentTypeImpliedTab ?? tabs[0]?.key ?? TransactionTab.CreatorStore,
  );
  const groupId = currentGroup?.id;

  // Single owner of the `tab` and `paymentType` query params. Reflects the active tab in the URL
  // so the page is shareable and refresh-stable (e.g. Virtual-as-default lands with `?tab=virtual`),
  // and drops `paymentType` — a Creator Store-only param — on any other tab. Legacy is an external
  // redirect, not a landable tab, so `?tab=Redirect` is never written (it would restore a blank page
  // on refresh). Spreads the existing query so `groupId` and other params survive. Gated on
  // `router.isReady` so we never clobber a real param before the query hydrates.
  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    const nextQuery = { ...router.query };
    if (activeTab !== TransactionTab.CreatorStore) {
      delete nextQuery.paymentType;
    }
    if (activeTab !== TransactionTab.Legacy) {
      nextQuery.tab = activeTab;
    }
    if (nextQuery.tab === router.query.tab && nextQuery.paymentType === router.query.paymentType) {
      return;
    }
    void router.replace({ pathname: router.pathname, query: nextQuery }, undefined, {
      shallow: true,
    });
  }, [activeTab, router]);

  const onChangeTab = useCallback(
    (_event: React.SyntheticEvent, newTab: TransactionTab) => {
      setActiveTab(newTab);
      // The URL sync (paymentType drop + tab reflect) is handled by the effect above, keyed on
      // activeTab, so it stays a single owner of those params.
      if (newTab === TransactionTab.Legacy) {
        const legacyUrl = groupId
          ? www.getLegacyGroupTransactionsUrl(groupId)
          : www.getLegacyTransactionsUrl();
        window.open(legacyUrl, '_blank');
      }
    },
    [groupId, setActiveTab],
  );

  const getTabContentContainer = useCallback(
    (tab: TransactionTab) => {
      switch (tab) {
        case TransactionTab.CreatorStore:
          return (
            <MarketplaceFiatServiceProvider>
              <CreatorStoreTransactions key={tab} />
            </MarketplaceFiatServiceProvider>
          );
        case TransactionTab.PaidAccess:
          return (
            <div>
              <PaidAccessTransactions groupId={groupId} />
            </div>
          );
        case TransactionTab.Virtual:
          return (
            <div>
              <VirtualTransactions />
            </div>
          );
        case TransactionTab.Legacy:
          return null;
        default: {
          throw new Error(`Unhandled tab type ${String(tab)}`);
        }
      }
    },
    [groupId],
  );

  const renderTabs = useMemo(() => {
    return (
      <Tabs
        data-testid='transactionTabsTestId'
        onChange={onChangeTab}
        orientation='horizontal'
        value={activeTab}
        variant='scrollable'>
        {tabs.map((tab) => {
          return (
            <Tab
              label={
                <Grid
                  className={cx({ [styles.tabWithIcon]: !!tab.icon })}
                  container
                  spacing={1}
                  justifyContent='center'
                  alignItems='center'
                  wrap='nowrap'>
                  <Grid item>{translate(tab.translationKey)}</Grid>
                  {!!tab.icon && <Grid item>{tab.icon}</Grid>}
                </Grid>
              }
              key={tab.key}
              value={tab.key}
            />
          );
        })}
      </Tabs>
    );
  }, [activeTab, cx, onChangeTab, styles.tabWithIcon, tabs, translate]);

  return (
    <>
      <HubMeta
        title={buildTitle(translate('Heading.Finances'), translate('Heading.Transactions'))}
      />
      <Grid container alignItems='flex-start' direction='column' spacing={6}>
        {tabs.length > 1 && (
          <Grid item className={styles.tabContainer}>
            {renderTabs}
            <Divider />
          </Grid>
        )}

        <Grid item className={styles.tabContainer}>
          {getTabContentContainer(activeTab)}
        </Grid>
      </Grid>
    </>
  );
};

export default withTranslation(TransactionsContainer, [
  TranslationNamespace.Transactions,
  TranslationNamespace.Navigation,
  // Error: shared `Response.UnknownError` used by the export snackbars.
  TranslationNamespace.Error,
  // Creations: thumbnail status labels (`Label.Unavailable`/`InReview`/`Moderated`) rendered
  // by the shared useThumbnailImage inside the transaction tables.
  TranslationNamespace.Creations,
  // Controls + Analytics: the virtual date-range picker reuses shared `Action.*` (Controls) and
  // month-nav `Label.PreviousMonth`/`NextMonth` (Analytics) keys for the Foundation picker labels.
  TranslationNamespace.Controls,
  TranslationNamespace.Analytics,
]);
