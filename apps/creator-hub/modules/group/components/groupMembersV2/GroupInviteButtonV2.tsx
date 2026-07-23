import { useTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';
import React, { Fragment, FunctionComponent } from 'react';
import { OrganizationsEventName } from '../../utils/eventUtils';
import { GroupInvitationsDialog } from './GroupInvitationsDialog/GroupInvitationsDialog';
import useFlaggedGroupInvitationsLog from './GroupInvitationsDialog/useFlaggedGroupInvitationsLog';

const GroupInviteButton: FunctionComponent = () => {
  const { translate } = useTranslation();

  const [invitationsDialogOpen, setInvitationsDialogOpen] = React.useState<boolean>(false);

  const flaggedLog = useFlaggedGroupInvitationsLog();

  return (
    <Fragment>
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
    </Fragment>
  );
};

export default GroupInviteButton;
