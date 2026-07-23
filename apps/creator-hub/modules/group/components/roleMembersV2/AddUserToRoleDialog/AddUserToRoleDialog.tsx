import React, { useState, FunctionComponent, Fragment, useRef } from 'react';
import { useTranslation } from '@rbx/intl';
import { RoleMetadata } from '@modules/clients/organizationApi';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  makeStyles,
  Typography,
} from '@rbx/ui';
import { User } from '@modules/clients';
import { useAddUserToRole } from '@modules/react-query/groupMembers';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import {
  UserCategory,
  UserSelect,
  useUserOptionsForOrgRoles,
} from '@modules/miscellaneous/common/components';

import { SelectedUserList } from './SelectedUserList';
import useCurrentOrganization from '../../../hooks/useCurrentOrganization';
import { logOrganizationsEvent, OrganizationsEventName } from '../../../utils/eventUtils';
import useBottomToast from '../../../hooks/useBottomToast';

export interface AddUserToRoleDialogProps {
  open: boolean;
  onClose: () => void;
  role: RoleMetadata;
}

const useStyles = makeStyles()((theme) => ({
  responsiveFullScreen: {
    width: 900,
    maxWidth: 900,
    [theme.breakpoints.down('Large')]: {
      width: 600,
      maxWidth: 600,
    },
    [theme.breakpoints.down('Medium')]: {
      margin: `-24px 0`,
      maxWidth: '100%',
      maxHeight: '100%',
      width: '100%',
      height: '100%',
    },
  },
  toast: {
    [theme.breakpoints.down('Medium')]: {
      bottom: 100,
    },
  },
}));

export const AddUserToRoleDialog: FunctionComponent<
  React.PropsWithChildren<AddUserToRoleDialogProps>
> = ({ open, onClose, role }) => {
  const { organization } = useCurrentOrganization();
  const { showBottomToast } = useBottomToast();
  const { translate } = useTranslation();
  const { mutateAsync: addUserToRole } = useAddUserToRole();
  const userSelectParams = useUserOptionsForOrgRoles(role.id);
  const {
    classes: { responsiveFullScreen, toast },
  } = useStyles();
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const invitationStatus = useRef<Set<number>>(new Set());

  const { unifiedLogger } = useUnifiedLoggerProvider();

  const closeDialog = () => {
    setSelectedUsers([]);
    onClose();
  };

  const addUserToRoleDraft = (user: User, userStatus: UserCategory | 'unknown') => {
    if (selectedUsers.find((existingUser) => existingUser.id === user.id)) {
      return; // User already invited
    }
    const newUser = { ...user };
    if (userStatus === 'InvitePending') {
      invitationStatus.current.add(user.id!);
    }
    setSelectedUsers((prev) => [...prev, newUser]);
  };

  const removeDraftUserFromRole = (userId: number) => {
    setSelectedUsers((userList) => {
      return userList.filter((selectedUser) => {
        return selectedUser.id !== userId;
      });
      invitationStatus.current.delete(userId);
    });
  };

  const addUsersToRole = async () => {
    closeDialog();
    const organizationId = organization?.id;
    if (!organizationId) {
      return;
    }
    if (!selectedUsers.length) {
      return;
    }
    try {
      await Promise.all(
        selectedUsers.map((userInvite) => {
          if (!(userInvite?.id && role?.id)) {
            return undefined;
          }
          const isInvitation = invitationStatus.current.has(userInvite.id!);

          return addUserToRole({
            organizationId: organization.id,
            member: {
              userId: userInvite.id!.toString(),
              // we need to pass the invitationId to the mutation so that relevant queries are invalidated. Value for invitationId is not used in the mutation.
              ...(isInvitation ? { invitationId: userInvite.id?.toString() } : {}),
            },
            roleId: role.id.toString(),
          });
        }),
      );

      showBottomToast(translate('Message.RoleAddedToUsers'), {
        severity: 'success',
        className: toast,
      });
    } catch {
      showBottomToast(translate('Error.AddingUsersToRole'), {
        severity: 'error',
        className: toast,
      });
    } finally {
      logOrganizationsEvent(unifiedLogger, OrganizationsEventName.ClickOrgsAddMemberToRole, {
        group_id: organization?.groupId ?? '',
        role_id: role.id?.toString() ?? '',
        user_ids: selectedUsers.map((user) => user.id?.toString() ?? '').join(','),
      });
      setSelectedUsers([]);
    }
  };

  return (
    <Dialog open={open} onClose={closeDialog} classes={{ paper: responsiveFullScreen }}>
      <DialogContent>
        <Grid container mb={1}>
          <Typography variant='h3' align='left'>
            {translate('Label.AddMemberToRole', { roleName: role.name ?? '' })}
          </Typography>
        </Grid>
        <Fragment>
          <Grid container mb={2}>
            <UserSelect onSelect={addUserToRoleDraft} {...userSelectParams} />
          </Grid>
          <SelectedUserList selectedUsers={selectedUsers} removeUser={removeDraftUserFromRole} />
        </Fragment>
      </DialogContent>
      <DialogActions>
        <Grid container justifyContent='flex-end' spacing={1}>
          <Grid item>
            <Button
              data-testid='close-button'
              fullWidth
              variant='contained'
              color='secondary'
              size='large'
              onClick={closeDialog}>
              {translate('Action.Cancel')}
            </Button>
          </Grid>
          <Grid item>
            <Button
              data-testid='invite-button'
              fullWidth
              variant='contained'
              color='primaryBrand'
              size='large'
              onClick={addUsersToRole}
              disabled={!selectedUsers.length}>
              {translate('Label.Add')}
            </Button>
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
};
