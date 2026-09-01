import type { FunctionComponent } from 'react';
import React, { useState, useCallback, useEffect } from 'react';
import { StatusCodes } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import {
  IconButton,
  Dialog,
  Avatar,
  List,
  ListItem,
  useSnackbar,
  ListItemAvatar,
  Typography,
  ListItemText,
  ListItemSecondaryAction,
  DeleteOutlinedIcon,
  DialogTemplate,
} from '@rbx/ui';
import { TranslatorType } from '@modules/clients/translationRoles';
import type { GetUserByIdResponse } from '@modules/clients/users';
import usersClient from '@modules/clients/users';
import { getResponseFromError } from '@modules/clients/utils';
import { inviteTranslatorEventModel } from '@modules/eventStream/constants/eventConstants';
import CreatorDashboardUserResponse from '@modules/eventStream/enum/CreatorDashboardUserResponse';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { SearchError } from '@modules/miscellaneous/common';
import { SearchDebounceInput } from '@modules/miscellaneous/components';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import TranslatorInviteOptions from '../../enums/TranslatorInviteOptions';
import useTranslatorManagement from '../../hooks/useTranslatorManagement';
import useTranslatorAdderStyles from './TranslatorAdder.styles';

export interface TranslatorSearchByUserIdDialogProps {
  currentUserIds: Set<number>;
  isDialogOpen: boolean;
  onCloseDialog: () => void;
}

const TranslatorSearchByUserIdDialog: FunctionComponent<
  React.PropsWithChildren<TranslatorSearchByUserIdDialogProps>
> = ({ currentUserIds, isDialogOpen, onCloseDialog }) => {
  const { trackerClient } = useEventTrackerProvider();
  const { translate } = useTranslation();
  const { enqueue } = useSnackbar();
  const { error } = useMetricsMonitoring();
  const {
    classes: { searchDialogContainer, selectedItemList, selectedItem, selectedItemContainer },
  } = useTranslatorAdderStyles();
  const [selectedUser, setSelectedUser] = useState<GetUserByIdResponse | null>(null);
  const { addTranslators } = useTranslatorManagement();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchResultData, setSearchResultData] = useState<GetUserByIdResponse[] | null>(null);

  const deleteSelectedUser = useCallback(() => {
    setSelectedUser(null);
  }, []);

  const handleSelectUser = useCallback(
    (user: GetUserByIdResponse) => {
      if (user.id && currentUserIds.has(user.id)) {
        setErrorMessage(translate('Message.DulplicateUser'));
      } else {
        setSelectedUser(user);
        setSearchResultData(null);
      }
    },
    [currentUserIds, translate],
  );

  const handleSearchByUserId = useCallback(
    async (searchString: string) => {
      setErrorMessage(null);
      const userId = Number(searchString);
      if (Number.isNaN(userId)) {
        setSearchResultData([]);
        return;
      }
      setSearchResultData(null);
      try {
        setSearchResultData([await usersClient.getUserById(userId)]);
      } catch (e) {
        const errRes = getResponseFromError(e);
        if (errRes?.status === StatusCodes.NOT_FOUND) {
          setSearchResultData([]);
          return;
        }
        error(`searchByUserId failed with status code ${errRes?.status}`);
        if (enqueue) {
          enqueue(
            {
              message: translate('Message.SearchError'),
              autoHide: true,
            },
            (reason) => reason === 'timeout',
          );
        }
      }
    },
    [error, enqueue, translate],
  );

  const handleCloseDialog = useCallback(() => {
    onCloseDialog();
    setErrorMessage(null);
  }, [onCloseDialog]);

  const handleConfirmClicked = useCallback(async () => {
    if (selectedUser && selectedUser.id) {
      handleCloseDialog();
      trackerClient.sendEvent(
        inviteTranslatorEventModel(
          selectedUser.id,
          CreatorDashboardUserResponse.Confirm,
          TranslatorType.User,
          TranslatorInviteOptions.ByUserId,
        ),
      );
      try {
        await addTranslators([selectedUser.id], TranslatorType.User);
        setSelectedUser(null);
      } catch {
        error('Localization - Translator - Failed to add by user id');
      }
    }
  }, [addTranslators, selectedUser, handleCloseDialog, error, trackerClient]);

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
    setSelectedUser(null);
    setErrorMessage(null);
  }, [addTranslators]);

  return (
    <Dialog fullWidth open={isDialogOpen}>
      <DialogTemplate
        onCancel={handleCloseDialog}
        onConfirm={handleConfirmClicked}
        confirmText={translate('Action.Confirm')}
        cancelText={translate('Action.Cancel')}
        title={translate('Heading.InviteByUserId')}
        content={
          <div className={searchDialogContainer}>
            <SearchDebounceInput
              onSearch={handleSearchByUserId}
              onSearchResultClear={handleSearchResultClear}
              searchResultData={searchResultData}
              getDisplayResult={(item) => item.name ?? ''}
              onSearchResultSelected={handleSelectUser}
              onSearchError={handleSearchError}
              errorMessage={errorMessage}
              searchResultPrefix='@'
            />
            <div className={selectedItemContainer}>
              {selectedUser && selectedUser.id && (
                <List className={selectedItemList}>
                  <ListItem className={selectedItem}>
                    <ListItemAvatar>
                      <Avatar variant='circular' alt='avatar'>
                        <Thumbnail2d
                          targetId={selectedUser.id}
                          type={ThumbnailTypes.avatarHeadshot}
                          alt='avatar'
                        />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText>
                      <Typography variant='body1'>{selectedUser.displayName}</Typography>
                    </ListItemText>
                    <ListItemText>
                      <Typography variant='body2'>{`@${selectedUser.name}`}</Typography>
                    </ListItemText>
                    <ListItemSecondaryAction>
                      <IconButton aria-label='delete' onClick={deleteSelectedUser} size='large'>
                        <DeleteOutlinedIcon fontSize='medium' color='secondary' />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              )}
            </div>
          </div>
        }
      />
    </Dialog>
  );
};

export default TranslatorSearchByUserIdDialog;
