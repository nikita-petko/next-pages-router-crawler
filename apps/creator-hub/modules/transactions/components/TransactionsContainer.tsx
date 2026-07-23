import React, { FunctionComponent, useCallback, useMemo, useState } from 'react';
import { Divider, Grid, Tab, Tabs } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useRouter } from 'next/router';

import MarketplaceFiatServiceProvider from '@modules/marketplaceFiatService/MarketplaceFiatServiceProvider';
import { urls } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { HubMeta, buildTitle } from '@rbx/creator-hub-history';

import CreatorStoreTransactions from '../creatorStore/components/CreatorStoreTransactions';
import PaidAccessTransactions from '../paidAccess/components/PaidAccessTransactions/PaidAccessTransactions';
import { TransactionTab, TransactionTabType } from '../types';
import useTransactionContainerStyles from './TransactionsContainer.styles';

const { www } = urls;

export interface TransactionsContainerProps {
  tabs: TransactionTabType[];
}

const TransactionsContainer: FunctionComponent<
  React.PropsWithChildren<TransactionsContainerProps>
> = ({ tabs }) => {
  const currentGroup = useCurrentGroup();
  const { translate } = useTranslation();
  const { classes: styles, cx } = useTransactionContainerStyles();
  const router = useRouter();
  const {
    query: { tab: urlQueryTab },
  } = router;

  const initialTab =
    typeof urlQueryTab === 'string'
      ? TransactionTab[urlQueryTab as keyof typeof TransactionTab]
      : null;
  const [activeTab, setActiveTab] = useState<TransactionTab>(
    initialTab ?? TransactionTab.CreatorStore,
  );
  const groupId = currentGroup?.id;

  // Remove creator store tableType from URL.
  const removePaymentTypeFromUrl = useCallback(() => {
    const updatedQuery = { ...router.query };
    delete updatedQuery.paymentType;

    router.replace(
      {
        pathname: router.pathname,
        query: updatedQuery,
      },
      undefined,
      { shallow: true },
    );
  }, [router]);

  const onChangeTab = useCallback(
    (_event: React.SyntheticEvent, newTab: TransactionTab) => {
      setActiveTab(newTab);
      if (newTab === TransactionTab.PaidAccess) {
        removePaymentTypeFromUrl();
      }
      if (newTab === TransactionTab.Legacy) {
        const legacyUrl = groupId
          ? www.getLegacyGroupTransactionsUrl(groupId)
          : www.getLegacyTransactionsUrl();
        window.open(legacyUrl, '_blank');
      }
    },
    [removePaymentTypeFromUrl, groupId, setActiveTab],
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
        case TransactionTab.Legacy:
          return null;
        default: {
          throw new Error(`Unhandled tab type ${tab}`);
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
                <Grid className={cx({ [styles.tabWithIcon]: !!tab.icon })} container spacing={1}>
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
    <React.Fragment>
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
    </React.Fragment>
  );
};

export default withTranslation(TransactionsContainer, [
  TranslationNamespace.Transactions,
  TranslationNamespace.Navigation,
]);
