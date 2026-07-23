import type { NextLayoutPage } from 'next';
import { LaunchIcon } from '@rbx/ui';
import Authenticated from '@modules/authentication/Authenticated';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';
import TransactionsContainer from '@modules/transactions/components/TransactionsContainer';
import { TransactionTab } from '@modules/transactions/types';
import getFinanceLayout from '@modules/finance/getFinanceLayout';

const Transactions: NextLayoutPage = () => {
  const transactionTabs = [
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

  return (
    <Authenticated>
      <ToolboxServiceApiProvider>
        <TransactionsContainer tabs={transactionTabs} />
      </ToolboxServiceApiProvider>
    </Authenticated>
  );
};

Transactions.getPageLayout = (page) => getFinanceLayout(page, { title: 'Heading.Transactions' });

export default Transactions;
