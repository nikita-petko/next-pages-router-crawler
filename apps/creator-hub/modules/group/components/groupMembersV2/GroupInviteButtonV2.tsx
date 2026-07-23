import type { FunctionComponent } from 'react';
import React, { Fragment } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';
import { OrganizationsEventName } from '../../utils/eventUtils';
import { GroupInvitationsDialog } from './GroupInvitationsDialog/GroupInvitationsDialog';
import useFlaggedGroupInvitationsLog from './GroupInvitationsDialog/useFlaggedGroupInvitationsLog';

const GroupInviteButton: FunctionComponent = () => {
  const { translate } = useTranslation();

  const [invitationsDialogOpen, setInvitationsDialogOpen] = React.useState<boolean>(false);

  const flaggedLog = useFlaggedGroupInvitationsLog();

  return (
    <>
      <Button
        variant='contained'
        color='primaryBrand'
        size='medium'
        onClick={() => {
          flaggedLog(OrganizationsEventName.ClickOrgsOpenGroupInvitationsDialog);
          setInvitationsDialogOpen(true);
        }}>
        {translate('Action.Invite')}
      </Button>
      <GroupInvitationsDialog
        open={invitationsDialogOpen}
        onClose={() => setInvitationsDialogOpen(false)}
      />
    </>
  );
};

export default GroupInviteButton;
