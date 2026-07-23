import React, {
  Fragment,
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Grid,
  makeStyles,
  Menu,
  Typography,
  Divider,
  Paper,
  Button,
  NavigateBeforeIcon,
  useMediaQuery,
  StickyFooter,
} from '@rbx/ui';
import { Member, RoleMetadata } from '@rbx/clients/organizationsServiceApi';
import { useTranslation } from '@rbx/intl';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { CreatorType } from '@modules/miscellaneous/common';
import { RobloxUsersApiGetUserResponse } from '@rbx/clients/users';
import {
  useAddUserToRole,
  useRemoveUserFromRole,
  useGetGroupInfo,
  useGetOrganizationRoles,
  useDeleteInvitation,
} from '@modules/react-query/groupMembers';
import { useAuthentication } from '@modules/authentication/providers';
import { ThumbnailWithNames } from '@modules/miscellaneous/common/components';
import {
  DefaultMemberIdPlaceholder,
  GroupMembersMenuState,
  InvitedMember,
} from '../../constants/groupConstants';
import RolesList from '../RolesList';
import { OrganizationsEventName, logOrganizationsEvent } from '../../utils/eventUtils';
import useCurrentOrganization from '../../hooks/useCurrentOrganization';
import RemoveMemberDialog from './RemoveMemberDialog';
import useBottomToast from '../../hooks/useBottomToast';

const useGroupMemberRoleModalStyles = makeStyles()((theme) => ({
  menuContainer: {
    width: 296,
    padding: '8px 16px',
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
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: theme.zIndex.appBar,
    backgroundColor: theme.palette.navigation.default,
  },

  mobileMenuBody: {
    padding: '24px 0px',
  },

  actionButton: {
    fontSize: theme.typography.fontSize,
  },

  beforeButton: {
    padding: '8px 5px',
  },
}));

export type GroupMemberRoleModalProps = {
  member: Member | InvitedMember;
  menuState: GroupMembersMenuState;
  user?: RobloxUsersApiGetUserResponse;
  anchor: HTMLButtonElement | null;
  onClose: () => void;
  open: boolean;
};

const GroupMemberRoleModal: FunctionComponent<GroupMemberRoleModalProps> = ({
  member,
  menuState,
  user,
  anchor,
  onClose,
  open,
}) => {
  const { translate } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const {
    classes: {
      menuContainer,
      captionHeader,
      divider,
      fullScreen,
      mobileMenuBody,
      actionButton,
      beforeButton,
    },
  } = useGroupMemberRoleModalStyles();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const { user: currentUser } = useAuthentication();
  const { showBottomToast } = useBottomToast();

  const { organization, permissions, refreshPermission } = useCurrentOrganization();
  const { data: groupInfo } = useGetGroupInfo(organization?.groupId);
  const { data: roles } = useGetOrganizationRoles(organization?.id);
  const { mutate: removeUserFromRole } = useRemoveUserFromRole();
  const { mutate: addUserToRole } = useAddUserToRole();
  const { mutate: deleteInvitation } = useDeleteInvitation();

  const [memberRoles, setMemberRoles] = useState<RoleMetadata[] | null | undefined>(member.roles);

  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false);

  const memberRolesMissing = useMemo(() => {
    return roles?.filter(
      (role) =>
        !memberRoles?.find((r) => r.id === role.id || role.id === DefaultMemberIdPlaceholder),
    );
  }, [roles, memberRoles]);

  const onAddRole = useCallback(
    async (role?: RoleMetadata) => {
      if (!organization?.id || !member.userId || !role?.id) return;
      setMemberRoles((prevRoles) => (prevRoles ?? []).concat(role));
      addUserToRole(
        {
          organizationId: organization.id,
          member,
          roleId: role.id,
        },
        {
          onSuccess: () => {
            if (member?.userId === currentUser?.id.toString()) {
              refreshPermission();
            }
            showBottomToast(translate('Message.RoleAdded'));
          },
          onError: () => {
            setMemberRoles((prevRoles) =>
              (prevRoles ?? []).filter((prevRole) => prevRole.id !== role.id),
            );
            showBottomToast(translate('Error.AddingRole'), { severity: 'error' });
          },
        },
      );
      logOrganizationsEvent(unifiedLogger, OrganizationsEventName.ClickOrgsAddRoleToMember, {
        group_id: organization?.groupId ?? '',
        role_id: role?.id?.toString() ?? '',
        user_id: member.userId?.toString() ?? '',
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
      showBottomToast,
      translate,
      refreshPermission,
    ],
  );

  const onRemoveRole = useCallback(
    async (role?: RoleMetadata) => {
      if (!organization?.id || !member.userId || !role?.id) return;
      setMemberRoles((prevRoles) =>
        (prevRoles ?? []).filter((prevRole) => prevRole.id !== role.id),
      );
      removeUserFromRole(
        {
          organizationId: organization.id,
          member,
          roleId: role.id,
        },
        {
          onSuccess: () => {
            if (member.userId === currentUser?.id.toString()) {
              refreshPermission();
            }
            showBottomToast(translate('Message.RoleRemoved'));
          },
          onError: () => {
            setMemberRoles((prevRoles) => (prevRoles ?? []).concat(role));
            showBottomToast(translate('Error.RemovingRole'), { severity: 'error' });
          },
        },
      );
      logOrganizationsEvent(unifiedLogger, OrganizationsEventName.ClickOrgsRemoveRoleFromMember, {
        group_id: organization?.groupId ?? '',
        role_id: role.id?.toString() ?? '',
        user_id: member.userId?.toString() ?? '',
        member_status: menuState,
      });
    },
    [
      organization,
      member,
      removeUserFromRole,
      unifiedLogger,
      menuState,
      currentUser,
      showBottomToast,
      translate,
      refreshPermission,
    ],
  );

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

  const label = useMemo(() => {
    if (menuState === GroupMembersMenuState.Invited) {
      return translate('Label.Pending');
    }
    if (member.userId === groupInfo?.ownerId?.toString()) {
      return translate('Label.Owner');
    }
    return '';
  }, [groupInfo, member, menuState, translate]);

  useEffect(() => {
    setMemberRoles(member.roles);
  }, [member.roles]);

  const menuContent = (
    <Grid container className={menuContainer} gap={1}>
      <Typography variant='caption' color='secondary' className={captionHeader}>
        {translate('Label.CurrentRoles')}
      </Typography>
      <RolesList roles={memberRoles ?? undefined} variant='remove' onClick={onRemoveRole} />

      {memberRolesMissing && memberRolesMissing.length > 0 && (
        <Fragment>
          <Typography variant='caption' color='secondary' className={captionHeader}>
            {translate('Label.AddRoles')}
          </Typography>
          <RolesList roles={memberRolesMissing} variant='add' onClick={onAddRole} />
        </Fragment>
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
    <Paper className={fullScreen}>
      <Grid container padding='0px 12px'>
        <Button
          variant='text'
          color='primary'
          onClick={onClose}
          className={beforeButton}
          startIcon={<NavigateBeforeIcon />}>
          {translate('Label.Members')}
        </Button>
        <Grid item className={mobileMenuBody} flexShrink={1} minWidth={0}>
          <Grid item display='flex'>
            <ThumbnailWithNames
              target={{
                id: member?.userId ? Number.parseInt(member.userId, 10) : undefined,
                name: user?.name,
                displayName: user?.displayName,
              }}
              targetType={CreatorType.User}
              label={label}
              variant='compact'
            />
          </Grid>
          <Divider className={divider} />
          {menuContent}
          {permissions?.canManageMembers &&
          member.userId !== groupInfo?.ownerId?.toString() &&
          member.userId !== currentUser?.id?.toString() ? (
            <Fragment>
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
            </Fragment>
          ) : null}
        </Grid>
      </Grid>
      <RemoveMemberDialog
        open={removeDialogOpen}
        setOpen={setRemoveDialogOpen}
        member={member}
        username={user?.name}
      />
    </Paper>
  );
};

export default GroupMemberRoleModal;
