import { useTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';
import React, { Fragment, FunctionComponent } from 'react';
import { RoleMetadata } from '@rbx/clients/organizationsServiceApi';
import { AddUserToRoleDialog } from './AddUserToRoleDialog/AddUserToRoleDialog';

export type AddUserToRoleButtonV2Props = {
  role: RoleMetadata;
};

const AddUserToRoleButtonV2: FunctionComponent<AddUserToRoleButtonV2Props> = ({ role }) => {
  const { translate } = useTranslation();

  const [addUserToRoleDialogOpen, setAddUserToRoleDialogOpen] = React.useState<boolean>(false);

  return (
    <Fragment>
      <Button
        variant='contained'
        color='primaryBrand'
        size='medium'
        onClick={() => setAddUserToRoleDialogOpen(true)}>
        {translate('Action.AddMembers')}
      </Button>
      <AddUserToRoleDialog
        open={addUserToRoleDialogOpen}
        onClose={() => setAddUserToRoleDialogOpen(false)}
        role={role}
      />
    </Fragment>
  );
};

export default AddUserToRoleButtonV2;
