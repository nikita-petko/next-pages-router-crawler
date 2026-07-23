import type { FunctionComponent } from 'react';
import React from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import type { GroupRoleMetadata } from '../../../clients/groups';
import { AddUserToRoleDialog } from './AddUserToRoleDialog';

export type AddUserToRoleButtonProps = {
  role: GroupRoleMetadata;
};

const AddUserToRoleButton: FunctionComponent<AddUserToRoleButtonProps> = ({ role }) => {
  const { translate } = useTranslation();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant='Standard' size='Small' onClick={() => setOpen(true)}>
        {translate('Action.AddMembers')}
      </Button>
      <AddUserToRoleDialog open={open} onClose={() => setOpen(false)} role={role} />
    </>
  );
};

export default AddUserToRoleButton;
