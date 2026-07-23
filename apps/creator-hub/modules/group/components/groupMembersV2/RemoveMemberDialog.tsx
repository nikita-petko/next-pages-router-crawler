import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import type { Member } from '@rbx/client-organizations-service-api/v1';
import { useTranslation } from '@rbx/intl';
import { Dialog, DialogTemplate } from '@rbx/ui';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { useRemoveMemberFromOrg } from '@modules/react-query/groupMembers';
import useBottomToast from '../../hooks/useBottomToast';
import useCurrentOrganization from '../../hooks/useCurrentOrganization';
import { OrganizationsEventName, logOrganizationsEvent } from '../../utils/eventUtils';

export type RemoveMemberDialogProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  member: Member;
  username?: string;
};

const RemoveMemberDialog: FunctionComponent<RemoveMemberDialogProps> = ({
  open,
  setOpen,
  member,
  username,
}) => {
  const { translate } = useTranslation();
  const { showBottomToast } = useBottomToast();

  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { organization } = useCurrentOrganization();
  const { mutate: removeMemberFromOrg } = useRemoveMemberFromOrg();

  const handleConfirmDialog = useCallback(() => {
    if (!organization?.id || !member.userId) {
      return;
    }
    removeMemberFromOrg(
      {
        organizationId: organization.id,
        member,
      },
      {
        onSuccess: () => {
          showBottomToast(translate('Message.UserRemoved'));
        },
        onError: () => {
          showBottomToast(translate('Error.RemovingUser'), { severity: 'error' });
        },
      },
    );
    logOrganizationsEvent(unifiedLogger, OrganizationsEventName.ClickOrgsRemoveMember, {
      group_id: organization?.groupId ?? '',
      user_id: `${member.userId}`,
    });
    setOpen(false);
  }, [
    removeMemberFromOrg,
    unifiedLogger,
    organization,
    member,
    setOpen,
    showBottomToast,
    translate,
  ]);

  return (
    <Dialog open={open}>
      <DialogTemplate
        color='destructive'
        title={translate('Action.RemoveUsername', {
          username: username ?? '',
        })}
        content={translate('Message.RemoveUsername', {
          username: username ?? '',
        })}
        confirmText={translate('Action.Remove')}
        onConfirm={handleConfirmDialog}
        cancelText={translate('Action.Cancel')}
        onCancel={() => setOpen(false)}
      />
    </Dialog>
  );
};

export default RemoveMemberDialog;
