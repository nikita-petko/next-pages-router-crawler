import type { FunctionComponent } from 'react';
import React, { useState } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useCurrentGroup from '../../hooks/useCurrentGroup';
import { OrganizationsEventName, logOrganizationsEvent } from '../../utils/eventUtils';
import GroupInvitationsDialog from './invitations/GroupInvitationsDialog';

const GroupInviteButton: FunctionComponent = () => {
  const { translate } = useTranslation();
  const { permissions, unifiedLogger } = useCurrentGroup();
  const [invitationsDialogOpen, setInvitationsDialogOpen] = useState<boolean>(false);

  if (permissions?.canInviteMembers !== true) {
    return null;
  }

  return (
    <>
      <Button
        variant='Emphasis'
        size='Medium'
        onClick={() => {
          logOrganizationsEvent(
            unifiedLogger,
            OrganizationsEventName.ClickOrgsOpenGroupInvitationsDialog,
          );
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
