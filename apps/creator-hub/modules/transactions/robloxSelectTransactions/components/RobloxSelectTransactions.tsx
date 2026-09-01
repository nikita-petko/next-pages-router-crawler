import type { FunctionComponent } from 'react';
import React from 'react';
import { ProgressCircle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useAuthentication } from '@modules/authentication/providers';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import RobloxSelectTransactionsTable from './RobloxSelectTransactionsTable';

// Roblox Select payment history via v1 history on `transaction-records`:
// - user:  GET /v1/users/{userId}/transactions?transactionType=RobloxSelectTransfer
// - group: GET /v1/groups/{groupId}/transactions?transactionType=RobloxSelectTransfer
const RobloxSelectTransactions: FunctionComponent<React.PropsWithChildren> = () => {
  const currentGroup = useCurrentGroup();
  const { user } = useAuthentication();
  const { translate } = useTranslation();

  const groupId = currentGroup?.id;
  const userId = groupId ? undefined : user?.id;
  const tableKey = `${userId ?? ''}-${groupId ?? ''}`;

  if (userId == null && groupId == null) {
    return (
      <div className='flex justify-center' data-testid='roblox-select-transactions-loading-id'>
        <ProgressCircle variant='Indeterminate' ariaLabel={translate('Label.Loading')} />
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-xxlarge' data-testid='roblox-select-transactions-id'>
      <RobloxSelectTransactionsTable key={tableKey} userId={userId} groupId={groupId} />
    </div>
  );
};

export default RobloxSelectTransactions;
