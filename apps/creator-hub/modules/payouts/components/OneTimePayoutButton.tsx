import type { FunctionComponent } from 'react';
import React, { useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';
import type { Organization } from '@modules/clients/organizationApi';
import OneTimePayoutDialogueV2 from './OneTimePayoutDialogueV2';

export interface OneTimePayoutButtonProps {
  organization: Organization;
  disabled?: boolean;
  loading?: boolean;
  groupFunds?: null | number;
  fetchGroupFunds: () => Promise<void>;
}

const OneTimePayoutButton: FunctionComponent<React.PropsWithChildren<OneTimePayoutButtonProps>> = ({
  organization,
  disabled,
  loading,
  groupFunds,
  fetchGroupFunds,
}) => {
  const { translate } = useTranslation();
  const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <Button
        variant='contained'
        color='primaryBrand'
        size='small'
        disabled={disabled}
        loading={loading}
        onClick={() => setOpen(true)}>
        {translate('Action.SendRobux')}
      </Button>
      <OneTimePayoutDialogueV2
        organization={organization}
        open={open}
        onClose={() => setOpen(false)}
        groupFunds={groupFunds ?? undefined}
        fetchGroupFunds={fetchGroupFunds}
      />
    </>
  );
};

export default OneTimePayoutButton;
