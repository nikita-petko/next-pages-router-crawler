import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { Dialog, DialogTemplate } from '@rbx/ui';
import type { GroupUserWithRoles } from '../../../clients/groups';
import useCurrentGroup from '../../../hooks/useCurrentGroup';
import { useRemoveMemberFromOrg } from '../../../queries';
import { OrganizationsEventName, logOrganizationsEvent } from '../../../utils/eventUtils';

export type RemoveMemberDialogProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  member: GroupUserWithRoles;
  username?: string;
};

const RemoveMemberDialog: FunctionComponent<RemoveMemberDialogProps> = ({
  open,
  setOpen,
  member,
  username,
}) => {
  const { translate } = useTranslation();

  const { organization, unifiedLogger, showToast } = useCurrentGroup();
  const { mutate: removeMemberFromOrg } = useRemoveMemberFromOrg();

  const handleConfirmDialog = useCallback(() => {
    if (!organization?.id || !member.user?.userId) {
      return;
    }
    removeMemberFromOrg(
      {
        organizationId: organization.id,
        groupId: organization.groupId,
        member,
      },
      {
        onSuccess: () => {
          showToast(translate('Message.UserRemoved'));
        },
        onError: () => {
          showToast(translate('Error.RemovingUser'), true);
        },
      },
    );
    logOrganizationsEvent(unifiedLogger, OrganizationsEventName.ClickOrgsRemoveMember, {
      group_id: organization?.groupId ?? '',
      user_id: member.user?.userId?.toString() ?? '',
    });
    setOpen(false);
  }, [removeMemberFromOrg, unifiedLogger, organization, member, setOpen, showToast, translate]);

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
