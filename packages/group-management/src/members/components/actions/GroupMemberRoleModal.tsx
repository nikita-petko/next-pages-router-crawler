import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Divider,
  Grid,
  makeStyles,
  Menu,
  NavigateBeforeIcon,
  Paper,
  StickyFooter,
  Typography,
  useMediaQuery,
} from '@rbx/ui';
import type { GroupRoleMetadata, GroupUserWithRoles } from '../../../clients/groups';
import useCurrentGroup from '../../../hooks/useCurrentGroup';
import {
  useAddUserToRole,
  useAddInvitedToRole,
  useDeleteInvitation,
  useGetGroupInfo,
  useGetGroupsRoles,
  useRemoveUserFromRole,
  useRemoveInvitedFromRole,
} from '../../../queries';
import type { InvitedMember } from '../../../utils/constants';
import { GroupMembersMenuState } from '../../../utils/constants';
import { OrganizationsEventName, logOrganizationsEvent } from '../../../utils/eventUtils';
import UserThumbnailWithNames from '../common/UserThumbnailWithNames';
import RemoveMemberDialog from './RemoveMemberDialog';
import RolesList from './RolesList';

const useGroupMemberRoleModalStyles = makeStyles()((theme) => ({
  menuContainer: {
    width: 296,
    [theme.breakpoints.down('Medium')]: {
      width: '100%',
      padding: 0,
    },
  },

  captionHeader: {
    fontWeight: theme.typography.fontWeightBold,
  },

  divider: {
    margin: `32px 0px`,
    color: theme.palette.components.divider,
  },

  fullScreen: {
    top: 0,
    left: 0,
    zIndex: theme.zIndex.appBar,
    backgroundColor: theme.palette.navigation.default,
  },

  actionButton: {
    fontSize: theme.typography.fontSize,
  },

  beforeButton: {
    padding: '8px 5px',
  },
}));

export type GroupMemberRoleModalProps = {
  member: GroupUserWithRoles | InvitedMember;
  menuState: GroupMembersMenuState;
  anchor: HTMLButtonElement | null;
  onClose: () => void;
  open: boolean;
};

const GroupMemberRoleModal: FunctionComponent<GroupMemberRoleModalProps> = ({
  member,
  menuState,
  anchor,
  onClose,
  open,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { menuContainer, captionHeader, divider, fullScreen, actionButton, beforeButton },
    cx,
  } = useGroupMemberRoleModalStyles();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const {
    organization,
    permissions,
    refreshPermission,
    user: currentUser,
    unifiedLogger,
    showToast,
  } = useCurrentGroup();
  const { data: groupInfo } = useGetGroupInfo(organization?.groupId);
  const { data: roles } = useGetGroupsRoles(organization?.groupId);
  const { mutate: removeUserFromRole } = useRemoveUserFromRole();
  const { mutate: removeInvitedFromRole } = useRemoveInvitedFromRole();
  const { mutate: addUserToRole } = useAddUserToRole();
  const { mutate: addInvitedToRole } = useAddInvitedToRole();
  const { mutate: deleteInvitation } = useDeleteInvitation();

  const [memberRoles, setMemberRoles] = useState<GroupRoleMetadata[] | null | undefined>(
    member.roles,
  );
  const [prevMemberRoles, setPrevMemberRoles] = useState(member.roles);
  if (prevMemberRoles !== member.roles) {
    setPrevMemberRoles(member.roles);
    setMemberRoles(member.roles);
  }

  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false);

  const memberRolesMissing = useMemo(() => {
    return roles?.filter((role) => !memberRoles?.find((r) => r.id === role.id));
  }, [roles, memberRoles]);

  const onAddRole = useCallback(
    async (role?: GroupRoleMetadata) => {
      if (!organization?.id || !member.user?.userId || !role?.id) {
        return;
      }
      setMemberRoles((prevRoles) => (prevRoles ?? []).concat(role));
      if (menuState === GroupMembersMenuState.Invited) {
        addInvitedToRole(
          {
            organizationId: organization.id,
            member,
            roleId: role.id,
          },
          {
            onSuccess: () => {
              showToast(translate('Message.RoleAdded'));
            },
            onError: () => {
              setMemberRoles((prevRoles) =>
                (prevRoles ?? []).filter((prevRole) => prevRole.id !== role.id),
              );
              showToast(translate('Error.AddingRole'), true);
            },
          },
        );
      } else {
        addUserToRole(
          {
            groupId: organization.groupId,
            member,
            roleId: role.id,
          },
          {
            onSuccess: () => {
              if (member?.user?.userId === currentUser?.id) {
                void refreshPermission();
              }
              showToast(translate('Message.RoleAdded'));
            },
            onError: () => {
              setMemberRoles((prevRoles) =>
                (prevRoles ?? []).filter((prevRole) => prevRole.id !== role.id),
              );
              showToast(translate('Error.AddingRole'), true);
            },
          },
        );
      }
      logOrganizationsEvent(unifiedLogger, OrganizationsEventName.ClickOrgsAddRoleToMember, {
        group_id: organization?.groupId ?? '',
        role_id: role?.id?.toString() ?? '',
        user_id: member.user?.userId?.toString() ?? '',
        member_status: menuState,
      });
    },
    [
      organization,
      member,
      addUserToRole,
      unifiedLogger,
      menuState,
      currentUser,
      showToast,
      translate,
      refreshPermission,
      addInvitedToRole,
    ],
  );

  const onRemoveRole = useCallback(
    async (role?: GroupRoleMetadata) => {
      if (!organization?.id || !member.user?.userId || !role?.id) {
        return;
      }
      setMemberRoles((prevRoles) =>
        (prevRoles ?? []).filter((prevRole) => prevRole.id !== role.id),
      );
      if (menuState === GroupMembersMenuState.Invited) {
        removeInvitedFromRole(
          {
            organizationId: organization.id,
            member,
            roleId: role.id,
          },
          {
            onSuccess: () => {
              showToast(translate('Message.RoleRemoved'));
            },
            onError: () => {
              setMemberRoles((prevRoles) => (prevRoles ?? []).concat(role));
              showToast(translate('Error.RemovingRole'), true);
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
              showToast(translate('Message.RoleRemoved'));
            },
            onError: () => {
              setMemberRoles((prevRoles) => (prevRoles ?? []).concat(role));
              showToast(translate('Error.RemovingRole'), true);
            },
          },
        );
      }
      logOrganizationsEvent(unifiedLogger, OrganizationsEventName.ClickOrgsRemoveRoleFromMember, {
        group_id: organization?.groupId ?? '',
        role_id: role.id?.toString() ?? '',
        user_id: member.user?.userId?.toString() ?? '',
        member_status: menuState,
      });
    },
    [
      organization,
      member,
      removeUserFromRole,
      removeInvitedFromRole,
      unifiedLogger,
      menuState,
      currentUser,
      showToast,
      translate,
      refreshPermission,
    ],
  );

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

  const label = useMemo(() => {
    if (menuState === GroupMembersMenuState.Invited) {
      return translate('Label.Pending');
    }
    if (member.user?.userId === groupInfo?.ownerId) {
      return translate('Label.Owner');
    }
    return '';
  }, [groupInfo, member, menuState, translate]);

  const menuContent = (
    <Grid container className={cx(menuContainer, 'padding-y-small padding-x-large')} gap={1}>
      <Typography variant='caption' color='secondary' className={captionHeader}>
        {translate('Label.CurrentRoles')}
      </Typography>
      <RolesList roles={memberRoles ?? undefined} variant='remove' onClick={onRemoveRole} />

      {memberRolesMissing && memberRolesMissing.length > 0 && (
        <>
          <Typography variant='caption' color='secondary' className={captionHeader}>
            {translate('Label.AddRoles')}
          </Typography>
          <RolesList roles={memberRolesMissing} variant='add' onClick={onAddRole} />
        </>
      )}
    </Grid>
  );

  return !isMobile ? (
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
      {menuContent}
    </Menu>
  ) : (
    <Paper className={cx(fullScreen, 'absolute width-full height-full')}>
      <Grid container padding='0px 12px'>
        <Button
          variant='text'
          color='primary'
          onClick={onClose}
          className={beforeButton}
          startIcon={<NavigateBeforeIcon />}>
          {translate('Label.Members')}
        </Button>
        <Grid item className='padding-y-xxlarge padding-x-none' flexShrink={1} minWidth={0}>
          <Grid item display='flex'>
            <UserThumbnailWithNames
              target={{
                id: member?.user?.userId,
                name: member?.user?.username,
                displayName: member?.user?.displayName,
              }}
              label={label}
            />
          </Grid>
          <Divider className={divider} />
          {menuContent}
          {permissions?.canManageMembers === true &&
          member.user?.userId !== groupInfo?.ownerId &&
          member.user?.userId !== currentUser?.id ? (
            <>
              <Divider className={divider} />
              <StickyFooter
                primary={{
                  variant: 'contained',
                  color: menuState === GroupMembersMenuState.Members ? 'destructive' : 'secondary',
                  onClick:
                    menuState === GroupMembersMenuState.Members
                      ? () => setRemoveDialogOpen(true)
                      : uninviteMember,
                  label:
                    menuState === GroupMembersMenuState.Members
                      ? translate('Action.RemoveMember')
                      : translate('Action.Uninvite'),
                }}
              />
              <Button
                variant='contained'
                color={menuState === GroupMembersMenuState.Members ? 'destructive' : 'secondary'}
                className={actionButton}
                onClick={
                  menuState === GroupMembersMenuState.Members
                    ? () => setRemoveDialogOpen(true)
                    : uninviteMember
                }>
                {menuState === GroupMembersMenuState.Members
                  ? translate('Action.RemoveMember')
                  : translate('Action.Uninvite')}
              </Button>
            </>
          ) : null}
        </Grid>
      </Grid>
      <RemoveMemberDialog
        open={removeDialogOpen}
        setOpen={setRemoveDialogOpen}
        member={member}
        username={member?.user?.username}
      />
    </Paper>
  );
};

export default GroupMemberRoleModal;
