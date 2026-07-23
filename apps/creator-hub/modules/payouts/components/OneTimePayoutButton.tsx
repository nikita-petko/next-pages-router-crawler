import { useSettings } from '@modules/settings';
import React, { Fragment, FunctionComponent, useState } from 'react';
import { Button } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { Organization } from '@modules/clients/organizationApi';
import OneTimePayoutDialogueV1 from './OneTimePayoutDialogue';
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
  const { settings } = useSettings();
  const OneTimePayoutDialogue = settings?.enableOneTimePayoutV2
    ? OneTimePayoutDialogueV2
    : OneTimePayoutDialogueV1;
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Fragment>
      <Button
        variant='contained'
        color='primaryBrand'
        size='small'
        disabled={disabled}
        loading={loading}
        onClick={() => setOpen(true)}>
        {translate('Action.SendRobux')}
      </Button>
      <OneTimePayoutDialogue
        organization={organization}
        open={open}
        onClose={() => setOpen(false)}
        groupFunds={groupFunds ?? undefined}
        fetchGroupFunds={fetchGroupFunds}
      />
    </Fragment>
  );
};

export default OneTimePayoutButton;
