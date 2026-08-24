import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { OrganizationsEventName, logOrganizationsEvent } from '../../utils/eventUtils';
import { GroupInvitationsDialog } from './GroupInvitationsDialog/GroupInvitationsDialog';

const GroupInviteButton: FunctionComponent = () => {
  const { translate } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const [invitationsDialogOpen, setInvitationsDialogOpen] = React.useState<boolean>(false);

  return (
    <>
      <Button
        variant='contained'
        color='primaryBrand'
        size='medium'
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
