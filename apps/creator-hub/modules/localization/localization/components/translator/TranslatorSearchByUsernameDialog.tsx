import type { FunctionComponent } from 'react';
import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import {
  IconButton,
  Dialog,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  ListItemSecondaryAction,
  DeleteOutlinedIcon,
  DialogTemplate,
} from '@rbx/ui';
import { TranslatorType } from '@modules/clients/translationRoles';
import type { UserSearchResponseData } from '@modules/clients/users';
import usersClient from '@modules/clients/users';
import { inviteTranslatorEventModel } from '@modules/eventStream/constants/eventConstants';
import CreatorDashboardUserResponse from '@modules/eventStream/enum/CreatorDashboardUserResponse';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { SearchError } from '@modules/miscellaneous/common';
import { SearchDebounceInput } from '@modules/miscellaneous/components';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import TranslatorInviteOptions from '../../enums/TranslatorInviteOptions';
import useTranslatorManagement from '../../hooks/useTranslatorManagement';
import useTranslatorAdderStyles from './TranslatorAdder.styles';

const maxTranslatorSelectionAllowed = 5;

export interface TranslatorSearchByUsernameDialogProps {
  currentUserIds: Set<number>;
  isDialogOpen: boolean;
  onCloseDialog: () => void;
}

const TranslatorSearchByUsernameDialog: FunctionComponent<
  React.PropsWithChildren<TranslatorSearchByUsernameDialogProps>
> = ({ currentUserIds, isDialogOpen, onCloseDialog }) => {
  const { trackerClient } = useEventTrackerProvider();
  const { translate } = useTranslation();
  const { error } = useMetricsMonitoring();
  const {
    classes: { searchDialogContainer, selectedItemList, selectedItem, selectedItemContainer },
  } = useTranslatorAdderStyles();
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResponseData[]>([]);
  const { addTranslators } = useTranslatorManagement();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchResultData, setSearchResultData] = useState<UserSearchResponseData[] | null>(null);

  const handleSearchByUsername = useCallback(async (searchString: string) => {
    setErrorMessage(null);
    setSearchResultData(null);
    try {
      const res = await usersClient.searchUsers(searchString);
      if (!res.data || res.data.length === 0) {
        setSearchResultData([]);
        return;
      }
      setSearchResultData(res.data);
    } catch {
      /* should throw search failed error here, but since we don't have ability to
      differenciate search failure vs not found error from the response, we throw
      not found error for all error. */
      setSearchResultData([]);
    }
  }, []);

  const deleteSelectedUser = useCallback((userid: number) => {
    setSelectedUsers((prev) => prev.filter((user) => user.id !== userid));
  }, []);

  const handleSelectUser = useCallback(
    (user: UserSearchResponseData) => {
      if (selectedUsers.length === maxTranslatorSelectionAllowed) {
        setErrorMessage(translate('Message.MaxTranslatorInviteReached'));
      } else if (user.id && currentUserIds.has(user.id)) {
        setErrorMessage(translate('Message.DulplicateUser'));
      } else {
        setSelectedUsers((prev) => {
          const dulplicateSelectedUser = prev.filter((prevUser) => prevUser.id === user.id);
          if (dulplicateSelectedUser.length > 0) {
            return prev;
          }
          return [...prev, user];
        });
      }
    },
    [selectedUsers, currentUserIds, translate],
  );

  const handleCloseDialog = useCallback(() => {
    onCloseDialog();
    trackerClient.sendEvent(
      inviteTranslatorEventModel(
        null,
        CreatorDashboardUserResponse.Cancel,
        null,
        TranslatorInviteOptions.ByUsername,
      ),
    );
    setErrorMessage(null);
  }, [onCloseDialog, trackerClient]);

  const handleConfirmClicked = useCallback(async () => {
    const userIdList: number[] = selectedUsers
      .map((user) => user.id)
      .filter((userid): userid is number => typeof userid !== 'undefined' && userid !== null);
    if (userIdList.length > 0) {
      handleCloseDialog();
      userIdList.forEach((userId) => {
        trackerClient.sendEvent(
          inviteTranslatorEventModel(
            userId,
            CreatorDashboardUserResponse.Confirm,
            TranslatorType.User,
            TranslatorInviteOptions.ByUsername,
          ),
        );
      });
      try {
        await addTranslators(userIdList, TranslatorType.User);
        setSelectedUsers([]);
      } catch {
        error('Localization - Translator - Failed to add by username');
      }
    }
  }, [selectedUsers, addTranslators, handleCloseDialog, error, trackerClient]);

  const handleSearchError = useCallback(
    (err: SearchError) => {
      if (err === SearchError.SearchNotFound) {
        setErrorMessage(translate('Message.UserNotFound'));
      }
    },
    [translate],
  );

  const handleSearchResultClear = useCallback(() => {
    setSearchResultData(null);
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    // when the add function changed, we wanna clear the current selected items,
    // this is to prevent issue with uncleared selected item being added to wrong places
    setSelectedUsers([]);
    setErrorMessage(null);
  }, [addTranslators]);

  return (
    <Dialog fullWidth open={isDialogOpen}>
      <DialogTemplate
        onCancel={handleCloseDialog}
        onConfirm={handleConfirmClicked}
        confirmText={translate('Action.Confirm')}
        cancelText={translate('Action.Cancel')}
        title={translate('Heading.InviteByUsername')}
        content={
          <div className={searchDialogContainer}>
            <SearchDebounceInput
              onSearch={handleSearchByUsername}
              onSearchResultClear={handleSearchResultClear}
              searchResultData={searchResultData}
              getDisplayResult={(item) => item.name ?? ''}
              onSearchResultSelected={handleSelectUser}
              onSearchError={handleSearchError}
              errorMessage={errorMessage}
              searchResultPrefix='@'
            />
            <div className={selectedItemContainer}>
              {selectedUsers.length > 0 && (
                <List className={selectedItemList}>
                  {selectedUsers
                    .filter((item) => typeof item !== 'undefined' && item.id !== null)
                    .map((user) => (
                      <ListItem key={user.id} className={selectedItem}>
                        <ListItemAvatar>
                          <Avatar variant='circular' alt='avatar'>
                            <Thumbnail2d
                              targetId={user.id!}
                              type={ThumbnailTypes.avatarHeadshot}
                              alt='avatar'
                            />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText>
                          <Typography variant='body1'>{user.displayName}</Typography>
                        </ListItemText>
                        <ListItemText>
                          <Typography variant='body2'>{`@${user.name}`}</Typography>
                        </ListItemText>
                        <ListItemSecondaryAction>
                          <IconButton
                            aria-label='delete'
                            onClick={() => deleteSelectedUser(user.id!)}
                            size='large'>
                            <DeleteOutlinedIcon fontSize='medium' color='secondary' />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                </List>
              )}
            </div>
          </div>
        }
      />
    </Dialog>
  );
};

export default TranslatorSearchByUsernameDialog;
