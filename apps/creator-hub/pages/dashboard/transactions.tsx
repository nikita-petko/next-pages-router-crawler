import { useMemo } from 'react';
import type { NextLayoutPage } from 'next';
import { useFlag } from '@rbx/flags';
import { Translate } from '@rbx/intl';
import { CircularProgress, LaunchIcon } from '@rbx/ui';
import { enableVirtualTransactionsTab } from '@generated/flags/creatorBusiness';
import Authenticated from '@modules/authentication/Authenticated';
import getFinanceLayout from '@modules/finance/getFinanceLayout';
import MarketplacePublishingRequirementsContextProvider from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsProvider';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';
import TransactionsContainer from '@modules/transactions/components/TransactionsContainer';
import useSyncCreatorContextFromQuery from '@modules/transactions/hooks/useSyncCreatorContextFromQuery';
import type { TransactionTabType } from '@modules/transactions/types';
import { TransactionTab } from '@modules/transactions/types';

const Transactions: NextLayoutPage = () => {
  const { ready, value: isVirtualTabEnabled } = useFlag(enableVirtualTransactionsTab);
  // Honor a `?groupId=<id>` deep link (e.g. redirected from roblox.com) by switching the active
  // creator context before the transactions load.
  const { isResolving: isResolvingCreatorContext } = useSyncCreatorContextFromQuery();

  const transactionTabs = useMemo<TransactionTabType[]>(() => {
    const tabs: TransactionTabType[] = [
      {
        key: TransactionTab.CreatorStore,
        translationKey: 'Label.CreatorStore',
      },
      {
        key: TransactionTab.PaidAccess,
        translationKey: 'Label.PaidAccess',
      },
      {
        key: TransactionTab.Legacy,
        translationKey: 'Heading.OtherTransactions',
        icon: <LaunchIcon fontSize='small' />,
      },
    ];
    // The Virtual tab is gated behind a feature flag. When enabled it is prepended,
    // so it becomes the default (first) tab; when disabled Creator Store stays the default.
    if (isVirtualTabEnabled) {
      tabs.unshift({
        key: TransactionTab.Virtual,
        translationKey: 'Label.Virtual',
      });
    }
    return tabs;
  }, [isVirtualTabEnabled]);

  return (
    <Authenticated>
      <MarketplacePublishingRequirementsContextProvider>
        <ToolboxServiceApiProvider>
          {/* Wait for the flag so the tab list (and thus the default tab) is settled before mount,
              and for any `?groupId` deep link to resolve so we never query the wrong creator. */}
          {ready && !isResolvingCreatorContext ? (
            <TransactionsContainer tabs={transactionTabs} />
          ) : (
            <CircularProgress />
          )}
        </ToolboxServiceApiProvider>
      </MarketplacePublishingRequirementsContextProvider>
    </Authenticated>
  );
};

Transactions.getPageLayout = (page) =>
  getFinanceLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Transactions' />
    ),
  });
Transactions.loggerConfig = { rosId: RosTeams.CreatorMarketplace };

export default Transactions;
