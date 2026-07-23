import type { FunctionComponent } from 'react';
import React, { useState, useCallback, useEffect, Fragment } from 'react';
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
import groupsClient, { type RobloxGroupsApiGroupDetailResponse } from '@modules/clients/groups';
import { TranslatorType } from '@modules/clients/translationRoles';
import { getResponseFromError } from '@modules/clients/utils';
import { inviteTranslatorEventModel } from '@modules/eventStream/constants/eventConstants';
import CreatorDashboardUserResponse from '@modules/eventStream/enum/CreatorDashboardUserResponse';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { SearchError } from '@modules/miscellaneous/common';
import { SearchDebounceInput } from '@modules/miscellaneous/components';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import TranslatorInviteOptions from '../../enums/TranslatorInviteOptions';
import useTranslatorManagement from '../../hooks/useTranslatorManagement';
import type { TranslatorRoleItem } from '../../types/TranslatorInfo';
import useTranslatorAdderStyles from './TranslatorAdder.styles';
import TranslatorGroupRoleSelectionMenu from './TranslatorGroupRoleSelectionMenu';

export interface TranslatorSearchByGroupIdDialogProps {
  currentGroupIds: Set<number>;
  isDialogOpen: boolean;
  onCloseDialog: () => void;
}

const TranslatorSearchByGroupIdDialog: FunctionComponent<
  React.PropsWithChildren<TranslatorSearchByGroupIdDialogProps>
> = ({ currentGroupIds, isDialogOpen, onCloseDialog }) => {
  const { trackerClient } = useEventTrackerProvider();
  const { translate } = useTranslation();
  const { enqueue } = useSnackbar();
  const { error } = useMetricsMonitoring();
  const {
    classes: { searchDialogContainer, selectedItemList, selectedItem, selectedItemContainer },
  } = useTranslatorAdderStyles();
  const [selectedGroup, setSelectedGroup] = useState<RobloxGroupsApiGroupDetailResponse | null>(
    null,
  );
  const [selectedAssignee, setSelectedAssignee] = useState<TranslatorRoleItem | null>(null);
  const { addTranslators } = useTranslatorManagement();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchResultData, setSearchResultData] = useState<
    RobloxGroupsApiGroupDetailResponse[] | null
  >(null);

  const deleteSelectedGroup = useCallback(() => {
    setSelectedGroup(null);
    setErrorMessage(null);
  }, []);

  const handleSelectGroup = useCallback((group: RobloxGroupsApiGroupDetailResponse) => {
    setErrorMessage(null);
    setSelectedAssignee(null);
    setSearchResultData(null);
    setSelectedGroup(group);
  }, []);

  const handleSelectGroupRole = useCallback(
    (translator: TranslatorRoleItem) => {
      let errMsg = null;
      if (translator.type === TranslatorType.GroupRole && currentGroupIds.has(translator.id)) {
        errMsg = translate('Message.DulplicateGroupRole');
      } else if (translator.type === TranslatorType.Group && currentGroupIds.has(translator.id)) {
        errMsg = translate('Message.DulplicateGroup');
      } else {
        setSelectedAssignee(translator);
      }
      setErrorMessage(errMsg);
    },
    [currentGroupIds, translate],
  );

  const handleSearchByGroupId = useCallback(
    async (searchString: string) => {
      const groupId = Number(searchString);
      if (Number.isNaN(groupId)) {
        setSearchResultData([]);
        return;
      }
      setSearchResultData(null);
      try {
        setSearchResultData([await groupsClient.getGroupInfo(groupId)]);
      } catch (e) {
        const errRes = getResponseFromError(e);
        if (errRes?.status === StatusCodes.BAD_REQUEST) {
          setSearchResultData([]);
          return;
        }
        error(`searchByGroupId failed with status code ${errRes?.status}`);
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
    if (selectedAssignee) {
      handleCloseDialog();
      trackerClient.sendEvent(
        inviteTranslatorEventModel(
          selectedAssignee.id,
          CreatorDashboardUserResponse.Confirm,
          TranslatorType.Group,
          TranslatorInviteOptions.ByGroupId,
        ),
      );
      try {
        await addTranslators([selectedAssignee.id], selectedAssignee.type);
        setSelectedGroup(null);
      } catch {
        error('Localization - Translator - Failed to add by group id');
      }
    }
  }, [addTranslators, selectedAssignee, handleCloseDialog, error, trackerClient]);

  const handleLoadRoleListFailed = useCallback(() => {
    setSelectedGroup(null);
    onCloseDialog();
  }, [onCloseDialog]);

  const handleSearchError = useCallback(
    (err: SearchError) => {
      if (err === SearchError.SearchNotFound) {
        setErrorMessage(translate('Message.GroupNotFound'));
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
    setSelectedGroup(null);
    setErrorMessage(null);
  }, [addTranslators]);

  return (
    <Dialog fullWidth open={isDialogOpen}>
      <DialogTemplate
        onCancel={handleCloseDialog}
        onConfirm={handleConfirmClicked}
        confirmText={translate('Action.Confirm')}
        cancelText={translate('Action.Cancel')}
        title={translate('Heading.InviteByGroupId')}
        content={
          <div className={searchDialogContainer}>
            <SearchDebounceInput
              onSearch={handleSearchByGroupId}
              onSearchResultClear={handleSearchResultClear}
              searchResultData={searchResultData}
              getDisplayResult={(item) => item.name ?? ''}
              onSearchResultSelected={handleSelectGroup}
              onSearchError={handleSearchError}
              errorMessage={errorMessage}
            />
            <div className={selectedItemContainer}>
              {selectedGroup && selectedGroup.id && (
                <>
                  <List className={selectedItemList}>
                    <ListItem className={selectedItem}>
                      <ListItemAvatar>
                        <Avatar variant='square' alt='avatar'>
                          <Thumbnail2d
                            targetId={selectedGroup.id}
                            type={ThumbnailTypes.groupIcon}
                            alt='avatar'
                          />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText>
                        <Typography variant='captionHeader'>{selectedGroup.name}</Typography>
                      </ListItemText>
                      <ListItemText>
                        <Typography variant='captionBody'>
                          {selectedGroup.owner?.displayName}
                        </Typography>
                      </ListItemText>
                      <ListItemSecondaryAction>
                        <IconButton aria-label='delete' onClick={deleteSelectedGroup} size='large'>
                          <DeleteOutlinedIcon fontSize='medium' color='secondary' />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                  <TranslatorGroupRoleSelectionMenu
                    group={selectedGroup}
                    onRoleSelected={handleSelectGroupRole}
                    onLoadRoleListFailed={handleLoadRoleListFailed}
                  />
                </>
              )}
            </div>
          </div>
        }
      />
    </Dialog>
  );
};

export default TranslatorSearchByGroupIdDialog;
