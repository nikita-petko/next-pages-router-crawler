import React, { useState, FunctionComponent, Fragment, ComponentProps, useCallback } from 'react';
import { useGetGroupInfo } from '@modules/react-query/groupMembers/groupMembersQueries';
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
  TextField,
  LinkIcon,
  InputAdornment,
  InputLabel,
} from '@rbx/ui';
import { User } from '@modules/clients';
import { useCreateInvitation } from '@modules/react-query/groupMembers/invitationsQueries';
import {
  UserSelect,
  UserSelectLogState,
  UserCategory,
  useUserOptionsForOrgInvites,
} from '@modules/miscellaneous/common/components';

import { OrganizationsEventName } from '../../../utils/eventUtils';
import { InviteQueryKey } from '../../../constants/groupConstants';
import useCurrentOrganization from '../../../hooks/useCurrentOrganization';
import { SelectedUserList } from './SelectedUserList';
import useBottomToast from '../../../hooks/useBottomToast';
import useFlaggedGroupInvitationsLog from './useFlaggedGroupInvitationsLog';

export interface GroupInvitationsDialogProps {
  open: boolean;
  onClose: () => void;
}

export interface UserInvitation {
  user: User;
  userCategory: UserCategory | 'unknown';
  roles: RoleMetadata[];
  logState: UserSelectLogState;
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

export type SearchResultClickLogParams = {
  numCharsInSearchbarOnItemClick: string;
  numCharsInSearchbarOnFocus: string;
  searchbarFocusedTimestampMilliseconds: string;
  searchbarTextFirstChangedTimestampMilliseconds: string;
  itemClickedTimestampMilliseconds: string;
  numCharsInItemDisplayName: string;
  numCharsInItemName: string;
  userCategory: UserCategory | 'unknown';
  isInvited: 'true' | 'false';
  isRemoved: 'true' | 'false';
  isCanceled: 'true' | 'false';
  pageName: string;
};

const createLogParams = (
  userInvitation: UserInvitation,
  inviteResult: 'invited' | 'removed' | 'canceled',
) => {
  const { user, userCategory, logState } = userInvitation;
  const logParams: SearchResultClickLogParams = {
    numCharsInSearchbarOnItemClick: `${logState.numCharsInSearchbarOnItemClick}`,
    numCharsInSearchbarOnFocus: `${logState.numCharsInSearchbarOnFocus}`,
    searchbarFocusedTimestampMilliseconds: `${logState.searchbarFocusedTimestampMilliseconds}`,
    searchbarTextFirstChangedTimestampMilliseconds: `${logState.searchbarTextFirstChangedTimestampMilliseconds}`,
    itemClickedTimestampMilliseconds: `${logState.itemClickedTimestampMilliseconds}`,
    numCharsInItemDisplayName: `${user.displayName?.length}`,
    numCharsInItemName: `${user.name?.length}`,
    userCategory,
    isInvited: inviteResult === 'invited' ? 'true' : 'false',
    isRemoved: inviteResult === 'removed' ? 'true' : 'false',
    isCanceled: inviteResult === 'canceled' ? 'true' : 'false',
    pageName: 'GroupInvitations',
  };
  return logParams;
};

export const GroupInvitationsDialog: FunctionComponent<
  React.PropsWithChildren<GroupInvitationsDialogProps>
> = ({ open, onClose }) => {
  const { organization } = useCurrentOrganization();
  const { data: groupInfo } = useGetGroupInfo(organization?.groupId);
  const { mutateAsync: createInvitation } = useCreateInvitation();
  const { showBottomToast } = useBottomToast();
  const { translate } = useTranslation();
  const userSelectParams = useUserOptionsForOrgInvites();
  const {
    classes: { responsiveFullScreen, toast },
  } = useStyles();
  const [selectedUsers, setSelectedUsers] = useState<UserInvitation[]>([]);
  const [inviteSent, setInviteSent] = useState<boolean>(false);

  const shareLinkUrl = `https://create.${process.env.robloxSiteDomain}/dashboard/group/members?${InviteQueryKey}=${organization?.id}`;

  const flaggedLog = useFlaggedGroupInvitationsLog();

  type OnCloseParams = Parameters<Exclude<ComponentProps<typeof Dialog>['onClose'], undefined>>;
  const logCancel = useCallback(
    (reason: OnCloseParams[1] | 'cancelButtonClick') => {
      flaggedLog(OrganizationsEventName.ClickOrgsGroupInvitationsDialogCancel, { reason });
      selectedUsers.forEach((userInvite) =>
        flaggedLog(
          OrganizationsEventName.ClickOrgsGroupInvitationsDialogSearchResult,
          createLogParams(userInvite, 'canceled'),
        ),
      );
    },
    [flaggedLog, selectedUsers],
  );

  const closeDialog = () => {
    setSelectedUsers([]);
    setInviteSent(false);
    onClose();
  };

  const addUserToInvite = (
    user: User,
    userCategory: UserCategory | 'unknown',
    logState: UserSelectLogState,
  ) => {
    if (selectedUsers.some((invitation) => invitation.user.id === user.id)) {
      return; // User already invited
    }
    setSelectedUsers((prev) => [...prev, { user, userCategory, roles: [], logState }]);
  };

  const removeUserFromInvite = (userId: number) => {
    const userInvite = selectedUsers.find((invite) => invite.user.id === userId);
    if (userInvite) {
      flaggedLog(
        OrganizationsEventName.ClickOrgsGroupInvitationsDialogSearchResult,
        createLogParams(userInvite, 'removed'),
      );
    }
    setSelectedUsers((userList) => {
      return userList.filter((invite) => {
        return invite.user.id !== userId;
      });
    });
  };

  const updateRolesForUser = (userId: number, selectedRoles: RoleMetadata[]) => {
    setSelectedUsers((prev) =>
      prev.map((invitation) =>
        invitation.user.id === userId ? { ...invitation, roles: selectedRoles } : invitation,
      ),
    );
  };

  const inviteSelectedUsers = async () => {
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
          return createInvitation({
            organizationId,
            recipientUserId: `${userInvite.user.id!}`,
            roleIds: userInvite.roles.map((role) => role.id!),
          });
        }),
      );
      showBottomToast(translate('Message.InvitationSent'), {
        severity: 'success',
        className: toast,
      });
      flaggedLog(OrganizationsEventName.ClickOrgsGroupInvitationsDialogInviteSelectedUsers, {
        numUsers: `${selectedUsers.length}`,
      });
      selectedUsers.forEach((userInvite) =>
        flaggedLog(
          OrganizationsEventName.ClickOrgsGroupInvitationsDialogSearchResult,
          createLogParams(userInvite, 'invited'),
        ),
      );
    } catch {
      showBottomToast(translate('Error.SendingInvitation'), {
        severity: 'error',
        className: toast,
      });
    } finally {
      setSelectedUsers([]);
      setInviteSent(true);
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLinkUrl);
      showBottomToast(translate('Message.LinkCopied'), { severity: 'success', className: toast });
    } catch {
      showBottomToast(translate('Message.InviteLinkCopyFailed'), {
        severity: 'error',
        className: toast,
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        logCancel(reason);
        closeDialog();
      }}
      classes={{ paper: responsiveFullScreen }}>
      <DialogContent>
        <Grid container mb={1}>
          <Typography variant='h3' align='left'>
            {translate('Heading.InviteCreators', {
              organizationName: groupInfo?.groupName ?? '',
            })}
          </Typography>
        </Grid>
        {!inviteSent && (
          <Fragment>
            <Grid container mb={2}>
              <UserSelect onSelect={addUserToInvite} {...userSelectParams} />
            </Grid>
            <SelectedUserList
              selectedUsers={selectedUsers}
              removeUserFromInvite={removeUserFromInvite}
              updateRolesForUser={updateRolesForUser}
            />
          </Fragment>
        )}
        {inviteSent && (
          <Fragment>
            <Grid container mb={3}>
              <Typography variant='body1'>
                {translate('Message.InvitationSentToCreators', {
                  organizationName: groupInfo?.groupName ?? '',
                })}
              </Typography>
            </Grid>
            <Grid container mb={1}>
              <InputLabel htmlFor='copy-share-link'>
                <Typography variant='h6'>{translate('Label.CopyGroupLink')}</Typography>
              </InputLabel>
            </Grid>
            <Grid container mb={2}>
              <TextField
                fullWidth
                label=''
                data-testid='share-link'
                id='copy-share-link'
                value={shareLinkUrl}
                onClick={copyShareLink}
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position='start'>
                      <LinkIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Fragment>
        )}
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
              onClick={() => {
                if (!inviteSent) {
                  logCancel('cancelButtonClick');
                }
                closeDialog();
              }}>
              {translate('Action.Close')}
            </Button>
          </Grid>
          {!inviteSent && (
            <Grid item>
              <Button
                data-testid='invite-button'
                fullWidth
                variant='contained'
                color='primaryBrand'
                size='large'
                onClick={inviteSelectedUsers}
                disabled={!selectedUsers.length}>
                {translate('Action.Invite')}
              </Button>
            </Grid>
          )}
          {inviteSent && (
            <Grid item>
              <Button
                data-testid='done-button'
                fullWidth
                variant='contained'
                color='primaryBrand'
                size='large'
                onClick={closeDialog}>
                {translate('Action.Done')}
              </Button>
            </Grid>
          )}
        </Grid>
      </DialogActions>
    </Dialog>
  );
};
