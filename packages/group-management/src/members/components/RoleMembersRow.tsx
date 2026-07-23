import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { IconButton } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Grid, makeStyles, useMediaQuery } from '@rbx/ui';
import type { GroupRoleMetadata, GroupUserWithRoles } from '../../clients/groups';
import useCurrentGroup from '../../hooks/useCurrentGroup';
import { useRemoveInvitedFromRole, useRemoveUserFromRole } from '../../queries';
import type { InvitedMember } from '../../utils/constants';
import { GroupMembersMenuState } from '../../utils/constants';
import { OrganizationsEventName, logOrganizationsEvent } from '../../utils/eventUtils';
import UserThumbnailWithNames from './common/UserThumbnailWithNames';

const useStyles = makeStyles()((theme) => ({
  row: {
    '&:hover': {
      background: theme.palette.states.hover,
    },
  },
}));

export type RoleMembersRowProps = {
  member: GroupUserWithRoles | InvitedMember;
  menuState: GroupMembersMenuState;
  role: GroupRoleMetadata | null;
};

const RoleMembersRow: FunctionComponent<RoleMembersRowProps> = ({ member, menuState, role }) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const [hovering, setHovering] = useState(false);

  const {
    organization,
    permissions,
    refreshPermission,
    user: currentUser,
    unifiedLogger,
    showToast,
  } = useCurrentGroup();
  const { mutate: removeUserFromRole } = useRemoveUserFromRole();
  const { mutate: removeInvitedFromRole } = useRemoveInvitedFromRole();

  const [isRemoving, setIsRemoving] = useState(false);

  const onRemoveRole = useCallback(async () => {
    if (!organization?.id || !member || !role?.id) {
      return;
    }
    setIsRemoving(true);
    if (menuState === GroupMembersMenuState.Invited) {
      removeInvitedFromRole(
        {
          organizationId: organization.id,
          member,
          roleId: role.id,
        },
        {
          onSuccess: () => {
            showToast(translate('Message.UserRemoved'));
          },
          onError: () => {
            setIsRemoving(false);
            showToast(translate('Error.RemovingUser'), true);
          },
        },
      );
    } else {
      removeUserFromRole(
        {
          groupId: organization.groupId,
          member,
          roleId: role.id,
        },
        {
          onSuccess: () => {
            if (member.user?.userId === currentUser?.id) {
              void refreshPermission();
            }
            showToast(translate('Message.UserRemoved'));
          },
          onError: () => {
            setIsRemoving(false);
            showToast(translate('Error.RemovingUser'), true);
          },
        },
      );
    }
    logOrganizationsEvent(unifiedLogger, OrganizationsEventName.ClickOrgsRemoveMemberFromRole, {
      group_id: organization?.groupId ?? '',
      role_id: role.id?.toString() ?? '',
      user_id: member.user?.userId?.toString() ?? '',
      member_status: menuState,
    });
  }, [
    organization,
    member,
    role,
    removeUserFromRole,
    removeInvitedFromRole,
    unifiedLogger,
    menuState,
    currentUser,
    showToast,
    translate,
    refreshPermission,
  ]);

  return (
    <Grid
      container
      className={`radius-small padding-y-small ${classes.row}`}
      wrap='nowrap'
      flexDirection='row'
      style={isMobile ? undefined : { paddingLeft: 16, paddingRight: 16 }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}>
      <Grid item flexGrow={1} flexShrink={1} minWidth={0}>
        <UserThumbnailWithNames
          target={{
            id: member?.user?.userId,
            name: member?.user?.username,
            displayName: member?.user?.displayName,
          }}
          label={
            menuState === GroupMembersMenuState.Invited ? translate('Label.Pending') : undefined
          }
          labelTooltip={
            menuState === GroupMembersMenuState.Invited
              ? translate('Label.PendingPermissions')
              : undefined
          }
        />
      </Grid>

      {/* TODO: Update permissions check for Manage Roles of Members */}
      {!isRemoving && role?.id && permissions?.isOwner && (isMobile || hovering) && (
        <Grid
          item
          style={{
            display: 'flex',
            padding: '4px 0px 4px 12px',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}>
          <IconButton
            icon='icon-regular-circle-minus'
            ariaLabel={translate('Action.Remove')}
            variant='Utility'
            size='Small'
            onClick={onRemoveRole}
          />
        </Grid>
      )}
    </Grid>
  );
};

export default RoleMembersRow;
