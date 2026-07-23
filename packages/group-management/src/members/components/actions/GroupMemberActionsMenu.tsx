import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { CancelIcon, LinkIcon, Menu, MenuItem, RemoveCircleOutlineIcon, Typography } from '@rbx/ui';
import type { GroupUserWithRoles } from '../../../clients/groups';
import useCurrentGroup from '../../../hooks/useCurrentGroup';
import { useDeleteInvitation } from '../../../queries';
import type { InvitedMember } from '../../../utils/constants';
import { GroupMembersMenuState } from '../../../utils/constants';
import { OrganizationsEventName, logOrganizationsEvent } from '../../../utils/eventUtils';
import RemoveMemberDialog from './RemoveMemberDialog';

export type GroupMemberActionsMenuProps = {
  member: GroupUserWithRoles | InvitedMember;
  menuState: GroupMembersMenuState;
  anchor: HTMLElement | null;
  onClose: () => void;
  open: boolean;
};

const GroupMemberActionsMenu: FunctionComponent<GroupMemberActionsMenuProps> = ({
  member,
  menuState,
  anchor,
  onClose,
  open,
}) => {
  const { translate } = useTranslation();

  const { organization, permissions, navigation, unifiedLogger, showToast } = useCurrentGroup();
  const { mutate: deleteInvitation } = useDeleteInvitation();

  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false);

  const copyGroupLink = useCallback(() => {
    if (!organization?.id || !navigation.getInvitationLinkUrl) {
      return;
    }
    const url = navigation.getInvitationLinkUrl(organization.id);
    void navigator.clipboard.writeText(url).then(() => {
      showToast(translate('Message.LinkCopied'));
    });
  }, [organization, navigation, showToast, translate]);

  const uninviteMember = useCallback(async () => {
    if (!organization?.id || !('invitationId' in member)) {
      return;
    }
    deleteInvitation(
      {
        organizationId: organization.id,
        member,
      },
      {
        onSuccess: () => {
          showToast(translate('Message.InvitationDeleted'));
        },
        onError: () => {
          showToast(translate('Error.DeletingInvitation'), true);
        },
      },
    );
    logOrganizationsEvent(unifiedLogger, OrganizationsEventName.ClickOrgsUninviteMember, {
      group_id: organization?.groupId ?? '',
      user_id: member.user?.userId?.toString() ?? '',
    });
  }, [organization, member, deleteInvitation, unifiedLogger, showToast, translate]);

  const showCopyLink = Boolean(navigation.getInvitationLinkUrl);

  return (
    <>
      <Menu
        variant='modal'
        anchorEl={anchor}
        open={open}
        onClose={onClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}>
        {menuState === GroupMembersMenuState.Invited ? (
          <>
            {showCopyLink && (
              <MenuItem className='padding-xsmall' onClick={copyGroupLink}>
                <LinkIcon />
                <Typography variant='body1' className='padding-left-large'>
                  {translate('Label.CopyGroupLink')}
                </Typography>
              </MenuItem>
            )}
            {permissions?.canManageMembers === true ? (
              <MenuItem className='padding-xsmall' onClick={uninviteMember}>
                <CancelIcon />
                <Typography variant='body1' className='padding-left-large'>
                  {translate('Action.Uninvite')}
                </Typography>
              </MenuItem>
            ) : null}
          </>
        ) : (
          <MenuItem className='padding-xsmall' onClick={() => setRemoveDialogOpen(true)}>
            <RemoveCircleOutlineIcon />
            <Typography variant='body1' className='padding-left-large'>
              {translate('Label.Remove')}
            </Typography>
          </MenuItem>
        )}
      </Menu>
      <RemoveMemberDialog
        open={removeDialogOpen}
        setOpen={setRemoveDialogOpen}
        member={member}
        username={member?.user?.username}
      />
    </>
  );
};

export default GroupMemberActionsMenu;
