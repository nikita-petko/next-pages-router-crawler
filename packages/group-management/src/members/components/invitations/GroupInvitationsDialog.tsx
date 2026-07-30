import type { FunctionComponent, ComponentProps } from 'react';
import React, { useState, useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  Typography,
  TextField,
  LinkIcon,
  InputAdornment,
  InputLabel,
} from '@rbx/ui';
import type { GroupRoleMetadata } from '../../../clients/groups';
import type { User } from '../../../clients/users';
import useCurrentGroup from '../../../hooks/useCurrentGroup';
import { useGetGroupInfo } from '../../../queries/groupMembersQueries';
import { useCreateInvitation } from '../../../queries/invitationsQueries';
import { UserSelect, useUserOptionsForOrgInvites } from '../../../userSelect';
import type { UserCategory, UserSelectLogState } from '../../../userSelect';
import { OrganizationsEventName, logOrganizationsEvent } from '../../../utils/eventUtils';
import { SelectedUserList } from './SelectedUserList';

const DialogPaperClassName =
  'width-[900px] max-width-[900px] max-[1140.95px]:width-[600px] max-[1140.95px]:max-width-[600px] max-[600.95px]:margin-y-[-24px] max-[600.95px]:margin-x-none max-[600.95px]:max-width-full max-[600.95px]:max-height-full max-[600.95px]:width-full max-[600.95px]:height-full';

export type GroupInvitationsDialogProps = {
  open: boolean;
  onClose: () => void;
};

export type UserInvitation = {
  user: User;
  userCategory: UserCategory | 'unknown';
  roles: GroupRoleMetadata[];
  logState: UserSelectLogState;
};

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
  const { organization, navigation, showToast, unifiedLogger } = useCurrentGroup();
  const { data: groupInfo } = useGetGroupInfo(organization?.groupId);
  const { mutateAsync: createInvitation } = useCreateInvitation();
  const { translate } = useTranslation();
  const userSelectParams = useUserOptionsForOrgInvites();
  const [selectedUsers, setSelectedUsers] = useState<UserInvitation[]>([]);
  const [inviteSent, setInviteSent] = useState<boolean>(false);

  const shareLinkUrl =
    organization?.id !== undefined && navigation.getInvitationLinkUrl !== undefined
      ? navigation.getInvitationLinkUrl(organization.id)
      : '';

  type OnCloseParams = Parameters<Exclude<ComponentProps<typeof Dialog>['onClose'], undefined>>;
  const logCancel = useCallback(
    (reason: OnCloseParams[1] | 'cancelButtonClick') => {
      logOrganizationsEvent(
        unifiedLogger,
        OrganizationsEventName.ClickOrgsGroupInvitationsDialogCancel,
        { reason },
      );
      selectedUsers.forEach((userInvite) =>
        logOrganizationsEvent(
          unifiedLogger,
          OrganizationsEventName.ClickOrgsGroupInvitationsDialogSearchResult,
          createLogParams(userInvite, 'canceled'),
        ),
      );
    },
    [unifiedLogger, selectedUsers],
  );

  const closeDialog = useCallback(() => {
    setSelectedUsers([]);
    setInviteSent(false);
    onClose();
  }, [onClose]);

  const addUserToInvite = useCallback(
    (user: User, userCategory: UserCategory | 'unknown', logState: UserSelectLogState) => {
      setSelectedUsers((previousUsers) =>
        previousUsers.some((invitation) => invitation.user.id === user.id)
          ? previousUsers
          : [...previousUsers, { user, userCategory, roles: [], logState }],
      );
    },
    [],
  );

  const removeUserFromInvite = useCallback(
    (userId: number) => {
      const userInvite = selectedUsers.find((invite) => invite.user.id === userId);
      if (userInvite) {
        logOrganizationsEvent(
          unifiedLogger,
          OrganizationsEventName.ClickOrgsGroupInvitationsDialogSearchResult,
          createLogParams(userInvite, 'removed'),
        );
      }
      setSelectedUsers((userList) => userList.filter((invite) => invite.user.id !== userId));
    },
    [selectedUsers, unifiedLogger],
  );

  const updateRolesForUser = useCallback((userId: number, selectedRoles: GroupRoleMetadata[]) => {
    setSelectedUsers((prev) =>
      prev.map((invitation) =>
        invitation.user.id === userId ? { ...invitation, roles: selectedRoles } : invitation,
      ),
    );
  }, []);

  const inviteSelectedUsers = async () => {
    const organizationId = organization?.id;
    if (!organizationId) {
      return;
    }
    if (!selectedUsers.length) {
      return;
    }
    try {
      const results = await Promise.allSettled(
        selectedUsers.map((userInvite) => {
          return createInvitation({
            organizationId,
            recipientUserId: `${userInvite.user.id ?? ''}`,
            roleIds: userInvite.roles.flatMap((role) =>
              role.id !== undefined && role.id !== null ? [role.id.toString()] : [],
            ),
          });
        }),
      );

      const failedInvitations = selectedUsers.filter(
        (_, index) => results[index]?.status === 'rejected',
      );
      if (failedInvitations.length > 0) {
        showToast(translate('Error.SendingInvitation'), true);
        setSelectedUsers(failedInvitations);
        return;
      }

      showToast(translate('Message.InvitationSent'));
      logOrganizationsEvent(
        unifiedLogger,
        OrganizationsEventName.ClickOrgsGroupInvitationsDialogInviteSelectedUsers,
        { numUsers: `${selectedUsers.length}` },
      );
      selectedUsers.forEach((userInvite) =>
        logOrganizationsEvent(
          unifiedLogger,
          OrganizationsEventName.ClickOrgsGroupInvitationsDialogSearchResult,
          createLogParams(userInvite, 'invited'),
        ),
      );
      setSelectedUsers([]);
      setInviteSent(true);
    } catch {
      showToast(translate('Error.SendingInvitation'), true);
    }
  };

  const copyShareLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareLinkUrl);
      showToast(translate('Message.LinkCopied'));
    } catch {
      showToast(translate('Message.InviteLinkCopyFailed'), true);
    }
  }, [shareLinkUrl, showToast, translate]);

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        logCancel(reason);
        closeDialog();
      }}
      classes={{ paper: DialogPaperClassName }}>
      <DialogContent>
        <Grid container mb={1}>
          <Typography variant='h3' align='left'>
            {translate('Heading.InviteCreators', {
              organizationName: groupInfo?.groupName ?? '',
            })}
          </Typography>
        </Grid>
        {!inviteSent && (
          <>
            <Grid container mb={2}>
              <UserSelect onSelect={addUserToInvite} {...userSelectParams} />
            </Grid>
            <SelectedUserList
              selectedUsers={selectedUsers}
              removeUserFromInvite={removeUserFromInvite}
              updateRolesForUser={updateRolesForUser}
            />
          </>
        )}
        {inviteSent && (
          <>
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
          </>
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

export default GroupInvitationsDialog;
