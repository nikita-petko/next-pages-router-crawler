import React, { Fragment, FunctionComponent, useCallback } from 'react';
import { Member } from '@rbx/clients/organizationsServiceApi';
import {
  CancelIcon,
  LinkIcon,
  makeStyles,
  Menu,
  MenuItem,
  RemoveCircleOutlineIcon,
  Typography,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { RobloxUsersApiGetUserResponse } from '@rbx/clients/users';
import { useDeleteInvitation } from '@modules/react-query/groupMembers';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import {
  GroupMembersMenuState,
  InvitedMember,
  InviteQueryKey,
} from '../../constants/groupConstants';
import useCurrentOrganization from '../../hooks/useCurrentOrganization';
import RemoveMemberDialog from './RemoveMemberDialog';
import useBottomToast from '../../hooks/useBottomToast';
import { OrganizationsEventName, logOrganizationsEvent } from '../../utils/eventUtils';

const useGroupMemberActionsMenuStyles = makeStyles()(() => ({
  menuItem: {
    padding: 4,
  },
  textItem: {
    paddingLeft: 16,
  },
}));

export type GroupMemberActionsMenuProps = {
  member: Member | InvitedMember;
  user?: RobloxUsersApiGetUserResponse;
  menuState: GroupMembersMenuState;
  anchor: HTMLElement | null;
  onClose: () => void;
  open: boolean;
};

const GroupMemberActionsMenu: FunctionComponent<GroupMemberActionsMenuProps> = ({
  member,
  user,
  menuState,
  anchor,
  onClose,
  open,
}) => {
  const { translate } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const {
    classes: { textItem, menuItem },
  } = useGroupMemberActionsMenuStyles();
  const { showBottomToast } = useBottomToast();

  const { organization, permissions } = useCurrentOrganization();
  const { mutate: deleteInvitation } = useDeleteInvitation();

  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false);

  const copyGroupLink = useCallback(() => {
    navigator.clipboard
      .writeText(
        `https://create.${process.env.robloxSiteDomain}/dashboard/group/members?${InviteQueryKey}=${organization?.id}`,
      )
      .then(() => {
        showBottomToast(translate('Message.LinkCopied'));
      });
  }, [organization, showBottomToast, translate]);

  const uninviteMember = useCallback(async () => {
    if (!organization?.id || !('invitationId' in member)) return;
    deleteInvitation(
      {
        organizationId: organization.id,
        member,
      },
      {
        onSuccess: () => {
          showBottomToast(translate('Message.InvitationDeleted'));
        },
        onError: () => {
          showBottomToast(translate('Error.DeletingInvitation'), { severity: 'error' });
        },
      },
    );
    logOrganizationsEvent(unifiedLogger, OrganizationsEventName.ClickOrgsUninviteMember, {
      group_id: organization?.groupId ?? '',
      user_id: member.userId?.toString() ?? '',
    });
  }, [organization, member, deleteInvitation, unifiedLogger, showBottomToast, translate]);

  return (
    <Fragment>
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
          <Fragment>
            <MenuItem className={menuItem} onClick={copyGroupLink}>
              <LinkIcon />
              <Typography variant='body1' className={textItem}>
                {translate('Label.CopyGroupLink')}
              </Typography>
            </MenuItem>
            {permissions?.canManageMembers ? (
              <MenuItem className={menuItem} onClick={uninviteMember}>
                <CancelIcon />
                <Typography variant='body1' className={textItem}>
                  {translate('Action.Uninvite')}
                </Typography>
              </MenuItem>
            ) : null}
          </Fragment>
        ) : (
          <MenuItem className={menuItem} onClick={() => setRemoveDialogOpen(true)}>
            <RemoveCircleOutlineIcon />
            <Typography variant='body1' className={textItem}>
              {translate('Label.Remove')}
            </Typography>
          </MenuItem>
        )}
      </Menu>
      <RemoveMemberDialog
        open={removeDialogOpen}
        setOpen={setRemoveDialogOpen}
        member={member}
        username={user?.name}
      />
    </Fragment>
  );
};

export default GroupMemberActionsMenu;
