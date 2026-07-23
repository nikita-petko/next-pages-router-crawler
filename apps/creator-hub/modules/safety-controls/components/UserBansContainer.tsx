import type { FunctionComponent } from 'react';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { OpenCloudError } from '@rbx/google-gax';
import { useTranslation, withTranslation } from '@rbx/intl';
import type { google } from '@rbx/open-cloud/dist/v2/protos/protos';
import {
  AddIcon,
  Button,
  Dialog,
  DialogTemplate,
  InputAdornment,
  SearchIcon,
  TextField,
  Typography,
} from '@rbx/ui';
import { unknownDueToCursorBasedPagination } from '@modules/charts-generic/tables/GenericTablePagination';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import type { TableColumnConfig } from '@modules/charts-generic/tables/types/GenericColumnType';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { CellDataType } from '@modules/charts-generic/tables/types/GenericTableType';
import openCloudSafetyClient from '@modules/clients/openCloudSafety';
import { EmptyState, Flex } from '@modules/miscellaneous/components';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import {
  BAN_API_DEVFORUM_ANNOUNCEMENT,
  EM_DASH,
  ModerationEvents,
  NOT_FOUND_ERROR_CODE,
  ROBLOX_USER_BANS_CREATOR_POLICIES,
  UserBansTableColumnConfigs,
  UserBansTableColumnKey,
  UserBansTableConfig,
} from '../constants/userBansConstants';
import { UserBansState, useUserBansStateContext } from '../layout/UserBansStateProvider';
import type { UserRestriction } from '../utils/userBansDataUtils';
import {
  convertTimestampToDate,
  getExperienceIdFromQueryParams,
  getUserIdFromUserPath,
  getUsernameFromUserId,
} from '../utils/userBansDataUtils';
import UseUserBansStyles from './UserBansContainer.styles';
import UserBansFeedback from './UserBansFeedback';
import BannedStatusLabel from './userBansTableComponents/BannedStatusLabel';
import MoreOptions from './userBansTableComponents/MoreOptions';
import User from './userBansTableComponents/User';

type TableData = {
  userRestrictions: UserRestriction[];
  nextPageToken: string;
}[];

const UserBansContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const {
    classes: { rootContainer, descriptionText, addUsersButton, unbanUsersButton, tableContainer },
  } = UseUserBansStyles();

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchInputValue, setSearchInputValue] = useState<string>('');
  // This is set to true because we have an initial data fetch on render using useEffect
  const [isTableLoading, setIsTableLoading] = useState<boolean>(true);
  const [userRestrictionsData, setUserRestrictionsData] = useState<TableData>([]);
  const [isUnbanDialogOpen, setIsUnbanDialogOpen] = useState<boolean>(false);
  const [pageNumber, setPageNumber] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isSearchResult, setIsSearchResult] = useState<boolean>(false);
  const [userIdUsernameMap, setUserIdUsernameMap] = useState<Map<number, string>>(
    new Map<number, string>(),
  );

  const {
    userBansState,
    setUserBansState,
    snackbarMessage,
    setSnackbarMessage,
    listUserIdsError,
    setListUserIdsError,
  } = useUserBansStateContext();

  const router = useRouter();
  const { translate, translateHTML, ready: areTranslationsReady } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const queryParams = router.query;
  const experienceId = getExperienceIdFromQueryParams(queryParams.id);
  const addUsersToBanUrl = creatorHub.dashboard.getAddUsersToBanUrl(experienceId);

  const userRestrictionsToDisplay = userRestrictionsData[pageNumber]?.userRestrictions ?? [];
  const currNextPageToken = userRestrictionsData[pageNumber]?.nextPageToken ?? '';

  const fetchNextPageUserRestrictionsData = async (
    maxPageSize: number,
    pageToken: string,
    pageNumberToFetch: number,
  ) => {
    setIsTableLoading(true);

    try {
      const [userRestrictions, , response] = await openCloudSafetyClient.listUserRestrictionsSync({
        parent: openCloudSafetyClient.universePath(experienceId.toString()),
        maxPageSize,
        pageToken,
      });
      const pageTokenResult = response.nextPageToken ?? '';

      const newUserIdUsernameMap = new Map(userIdUsernameMap);
      const userIdUsernamePairs = await Promise.all(
        userRestrictions.map(async (userRestriction): Promise<[number, string]> => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
          const userId = getUserIdFromUserPath(userRestriction.user as string);
          const username = await getUsernameFromUserId(userId);
          return [userId, username];
        }),
      );
      userIdUsernamePairs.forEach(([userId, username]) => {
        newUserIdUsernameMap.set(userId, username);
      });

      setUserIdUsernameMap(newUserIdUsernameMap);

      // If pageNumberToFetch < userRestrictionsData.length, we replace that page's data and remove
      // further pages from the cache. If pageNumberToFetch = 0, it means we are on the initial fetch
      setUserRestrictionsData((prevUserRestrictionsData) => [
        ...prevUserRestrictionsData.slice(0, pageNumberToFetch),
        { userRestrictions, nextPageToken: pageTokenResult },
      ]);
    } catch (error) {
      setUserRestrictionsData([]);
      setSnackbarMessage(translate('Tooltip.ErrorLoadingTable'));
      setUserBansState(UserBansState.SnackbarError);

      throw error;
    } finally {
      setIsTableLoading(false);
    }
  };

  /**
   * Fetch the initial data once the translations are ready.
   * Prevents any errors from being thrown when the translations are not ready which would cause
   * the snackbar to just show an empty string.
   */
  useEffect(() => {
    if (areTranslationsReady) {
      void fetchNextPageUserRestrictionsData(pageSize, '', 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run when translations are ready
  }, [areTranslationsReady]);

  const pagination = {
    page: pageNumber,
    total: unknownDueToCursorBasedPagination,
    pageSize,
    pageSizeOptions: [10, 25],
    setPageSize: async (newPageSize: number) => {
      setPageSize(newPageSize);
      if (isSearchResult) {
        return;
      }

      // Reset back to first page when changing page size and empty cache
      setPageNumber(0);
      setSelectedUsers([]);
      await fetchNextPageUserRestrictionsData(newPageSize, '', 0);
    },
    onNextPage: async () => {
      // Remove checked users
      setSelectedUsers([]);
      const nextPageNumber = pageNumber + 1;
      setPageNumber(nextPageNumber);
      if (nextPageNumber >= userRestrictionsData.length) {
        await fetchNextPageUserRestrictionsData(pageSize, currNextPageToken, nextPageNumber);
      }
    },
    onPreviousPage: () => {
      // Remove checked users
      setSelectedUsers([]);
      setPageNumber(pageNumber - 1);
    },
    hasNext: currNextPageToken !== '',
    hasPrevious: pageNumber > 0,
  };

  const setSelectedUserChecked = (rowKey: string, checked: boolean) => {
    setSelectedUsers((prevSelectedUsers) => {
      if (checked) {
        return [...prevSelectedUsers, rowKey];
      }
      return prevSelectedUsers.filter((selectedUser) => selectedUser !== rowKey);
    });
  };

  const columnConfigs: TableColumnConfig<UserBansTableColumnKey>[] = UserBansTableColumnConfigs.map(
    (config) => {
      if (config.columnKey === UserBansTableColumnKey.Select) {
        const headerRowKey = 'headerSelect';
        return {
          ...config,
          selection: {
            headerCellSelectionData: {
              rowKey: headerRowKey,
              // for the header row checkbox, it should be checked iff all users are selected
              checked:
                selectedUsers.length > 0 &&
                selectedUsers.length === userRestrictionsToDisplay.length,
              onChange: (rowKey: string, checked: boolean) => {
                // for the header row checkbox, clicking it should select/unselect all users
                setSelectedUsers(
                  checked
                    ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
                      userRestrictionsToDisplay.map((userBanData) => userBanData.user as string)
                    : [],
                );
              },
            },
          },
        };
      }
      return config;
    },
  );

  const tableRowData = userRestrictionsToDisplay.map((userRestriction) => {
    const hasBeenBanned = userRestriction.gameJoinRestriction?.startTime?.seconds !== null;
    const displayExcludeAltAccounts = userRestriction.gameJoinRestriction?.excludeAltAccounts
      ? translate('Label.No')
      : translate('Label.Yes');
    return new Map<UserBansTableColumnKey, CellDataType>([
      [
        UserBansTableColumnKey.UserKey,
        {
          type: ColumnType.Number,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
          value: getUserIdFromUserPath(userRestriction.user as string),
        },
      ],
      [
        UserBansTableColumnKey.Select,
        {
          type: ColumnType.Selection,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
          rowKey: userRestriction.user as string,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
          checked: selectedUsers.includes(userRestriction.user as string),
          onChange: setSelectedUserChecked,
        },
      ],
      [
        UserBansTableColumnKey.User,
        {
          type: ColumnType.Other,
          value: (
            <User
              key={userRestriction.user}
              // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
              userId={getUserIdFromUserPath(userRestriction.user as string)}
              username={
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
                userIdUsernameMap.get(getUserIdFromUserPath(userRestriction.user as string)) ??
                EM_DASH
              }
            />
          ),
        },
      ],
      [
        UserBansTableColumnKey.AltsBanned,
        {
          type: ColumnType.Text,
          value: hasBeenBanned ? displayExcludeAltAccounts : EM_DASH,
        },
      ],
      [
        UserBansTableColumnKey.PublicReason,
        {
          type: ColumnType.Text,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty-string displayReason should also fall back to EM_DASH (per dmoon@ review on PR #13823)
          value: userRestriction.gameJoinRestriction?.displayReason || EM_DASH,
        },
      ],
      [
        UserBansTableColumnKey.PrivateReason,
        {
          type: ColumnType.Text,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty-string privateReason should also fall back to EM_DASH (per dmoon@ review on PR #13823)
          value: userRestriction.gameJoinRestriction?.privateReason || EM_DASH,
        },
      ],
      [
        UserBansTableColumnKey.BannedDate,
        {
          type: ColumnType.Timestamp,
          value:
            userRestriction.gameJoinRestriction?.startTime?.seconds != null
              ? convertTimestampToDate(userRestriction.gameJoinRestriction?.startTime)
              : EM_DASH,
        },
      ],
      [
        UserBansTableColumnKey.BannedStatus,
        {
          type: ColumnType.Other,
          value: (
            <BannedStatusLabel
              key={userRestriction.user}
              // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
              active={userRestriction.gameJoinRestriction?.active as boolean}
              duration={userRestriction.gameJoinRestriction?.duration ?? null}
              startTime={
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
                userRestriction.gameJoinRestriction?.startTime as google.protobuf.ITimestamp
              }
            />
          ),
        },
      ],
      [
        UserBansTableColumnKey.More,
        {
          type: ColumnType.Other,
          value: (
            <MoreOptions
              key={userRestriction.user}
              universeId={experienceId}
              // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
              userId={getUserIdFromUserPath(userRestriction.user as string)}
            />
          ),
        },
      ],
    ] as const);
  });

  const handleSearchKeyDown = async (event: React.KeyboardEvent) => {
    if (event.key !== 'Enter') {
      return;
    }

    // If typing Enter with nothing in search bar, default back to the table view
    if (searchInputValue === '') {
      setIsSearchResult(false);

      // Reset back to initial data state
      setPageNumber(0);
      setSelectedUsers([]);
      await fetchNextPageUserRestrictionsData(pageSize, '', 0);
      return;
    }

    // For pagination to match the singular search result
    setPageNumber(0);
    setIsSearchResult(true);

    // Search input validation
    if (Number.isNaN(Number(searchInputValue))) {
      setUserRestrictionsData([]);
      setSnackbarMessage(translate('Tooltip.NoUsersFoundSearch'));
      setUserBansState(UserBansState.SnackbarError);
      return;
    }

    // Otherwise, fetch data for input
    setIsTableLoading(true);
    try {
      const [response] = await openCloudSafetyClient.getUserRestriction({
        path: openCloudSafetyClient.universeUserRestrictionPath(
          experienceId.toString(),
          searchInputValue,
        ),
      });

      // TODO: Note that currently, we also don't return expired bans, as our
      // GetUserRestriction endpoint hasn't been updated: https://roblox.atlassian.net/browse/WHAM-1017

      // If the user has never been banned or is unbanned, show no banned users found tooltip
      if (
        (!response.gameJoinRestriction || !response.gameJoinRestriction.active) &&
        !response.gameJoinRestriction?.startTime
      ) {
        setUserRestrictionsData([]);
        setSnackbarMessage(translate('Tooltip.NoUsersFoundSearch'));
        setUserBansState(UserBansState.SnackbarError);
        return;
      }

      if (!userIdUsernameMap.has(Number(searchInputValue))) {
        const newUserIdUsernameMap = new Map(userIdUsernameMap);
        const username = await getUsernameFromUserId(Number(searchInputValue));
        newUserIdUsernameMap.set(Number(searchInputValue), username);
        setUserIdUsernameMap(newUserIdUsernameMap);
      }

      setUserRestrictionsData([{ userRestrictions: [response], nextPageToken: '' }]);
    } catch (error) {
      // TODO (yinanzhao): Find an import for NOT_FOUND_ERROR_CODE
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      if (!(error instanceof OpenCloudError) || error.code !== NOT_FOUND_ERROR_CODE) {
        throw error;
      }

      setUserRestrictionsData([]);
      setSnackbarMessage(translate('Tooltip.NoUsersFoundSearch'));
      setUserBansState(UserBansState.SnackbarError);
    } finally {
      setIsTableLoading(false);

      unifiedLogger.logImpressionEvent({
        eventName: ModerationEvents.SEARCH_IMPRESSION_EVENT,
        parameters: {
          userSearched: searchInputValue,
        },
      });
    }
  };

  const handleUnbanUsers = async () => {
    setIsTableLoading(true);
    const unbanPromises = selectedUsers.map((userPath) =>
      openCloudSafetyClient.updateUserRestriction({
        userRestriction: {
          path: openCloudSafetyClient.universeUserRestrictionPath(
            experienceId.toString(),
            getUserIdFromUserPath(userPath).toString(),
          ),
          gameJoinRestriction: {
            active: false,
          },
        },
      }),
    );
    const results = await Promise.allSettled(unbanPromises);
    const errorResults = results
      .map((res, index) => ({
        res,
        userId: getUserIdFromUserPath(selectedUsers[index]).toString(),
      }))
      .filter(({ res }) => res.status !== 'fulfilled');
    const errorUserIds = errorResults.map(({ userId }) => userId);

    if (errorUserIds.length > 0) {
      setListUserIdsError(errorUserIds);
      setUserBansState(UserBansState.UnbanUsersDialogError);

      unifiedLogger.logErrorEvent({
        eventName: ModerationEvents.UNBAN_CLICK_EVENT_ERROR,
        parameters: {
          erroredUsers: errorUserIds.toString(),
        },
      });
    } else {
      setSnackbarMessage(
        translate(
          selectedUsers.length === 1
            ? 'Tooltip.UnbanSuccessfullyAppliedSingular'
            : 'Tooltip.UnbanSuccessfullyApplied',
          { numUsers: selectedUsers.length.toString() },
        ),
      );
      setUserBansState(UserBansState.SnackbarSuccess);

      unifiedLogger.logClickEvent({
        eventName: ModerationEvents.UNBAN_CLICK_EVENT,
        parameters: {
          usersToUnban: selectedUsers.toString(),
        },
      });
    }

    // Extract pageToken before updating userRestrictionData to refresh current page data
    const pageTokenToFetch =
      pageNumber === 0 ? '' : userRestrictionsData[pageNumber - 1].nextPageToken;

    // Re-fetch the data when unbans happen.
    await fetchNextPageUserRestrictionsData(pageSize, pageTokenToFetch, pageNumber);

    setSelectedUsers([]);
    setIsTableLoading(false);

    setIsUnbanDialogOpen(false);
  };

  const noUsersBanned =
    pageNumber === 0 &&
    userRestrictionsToDisplay.length === 0 &&
    !isSearchResult &&
    !isTableLoading;

  const useBanPageBodyComponent = noUsersBanned ? (
    <EmptyState
      size='small'
      illustration='noUsers'
      title={translate('Title.UserBansEmptyState')}
      description={translateHTML('Description.UserBansEmptyState', [
        {
          opening: 'linkStart',
          closing: 'linkEnd',
          content(chunks) {
            return (
              <a rel='noopener noreferrer' target='_blank' href={BAN_API_DEVFORUM_ANNOUNCEMENT}>
                {chunks}
              </a>
            );
          },
        },
      ])}>
      <Button
        color='primary'
        onClick={() => router.push(addUsersToBanUrl)}
        startIcon={<AddIcon />}
        variant='contained'>
        {translate('Label.AddUsers')}
      </Button>
    </EmptyState>
  ) : (
    <>
      <div className={addUsersButton}>
        <Button
          color='primaryBrand'
          onClick={() => router.push(addUsersToBanUrl)}
          startIcon={<AddIcon />}
          variant='contained'>
          {translate('Label.AddUsers')}
        </Button>
      </div>
      <Flex alignItems='center'>
        <TextField
          id='search-user-ids'
          label=''
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setSearchInputValue(event.target.value)
          }
          onKeyDown={handleSearchKeyDown}
          placeholder={translate('Label.SearchUserIds')}
          value={searchInputValue}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='large' />
              </InputAdornment>
            ),
          }}
        />
        {selectedUsers.length > 0 && (
          <Button
            classes={{ root: unbanUsersButton }}
            color='primary'
            onClick={() => setIsUnbanDialogOpen(true)}
            variant='contained'>
            {
              // TODO: For Label.UnbanXUsers, change once ICU pluralization is supported
              translate(selectedUsers.length === 1 ? 'Label.UnbanOneUser' : 'Label.UnbanXUsers', {
                numUsers: selectedUsers.length.toString(),
              })
            }
          </Button>
        )}
      </Flex>
      <GenericTableV2
        isDataLoading={isTableLoading}
        isResponseFailed={false}
        isUserForbidden={false}
        columnConfigs={columnConfigs}
        tableConfig={UserBansTableConfig}
        rowData={tableRowData}
        pagination={pagination}
        classes={{ tableContainer }}
        getRowKey={(rowData: Map<UserBansTableColumnKey, CellDataType>) => {
          const userKeycell = rowData.get(UserBansTableColumnKey.UserKey);
          if (userKeycell?.type !== ColumnType.Number) {
            throw new Error('UserKey cell is not a number');
          }
          return userKeycell.value.toString();
        }}
      />
    </>
  );

  return (
    <Flex classes={{ root: rootContainer }} flexDirection='column'>
      <Typography classes={{ root: descriptionText }}>
        {translateHTML('Description.Bans', [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content(chunks) {
              return (
                <a
                  rel='noopener noreferrer'
                  target='_blank'
                  href={ROBLOX_USER_BANS_CREATOR_POLICIES}>
                  {chunks}
                </a>
              );
            },
          },
        ])}
      </Typography>
      {useBanPageBodyComponent}
      <Dialog open={isUnbanDialogOpen}>
        <DialogTemplate
          cancelText={translate('Action.Cancel')}
          confirmText={translate('Action.Confirm')}
          content={translate('Description.ConfirmUnban')}
          onCancel={() => setIsUnbanDialogOpen(false)}
          onConfirm={handleUnbanUsers}
          title={translate(
            // TODO: For Title.ConfirmUnban, change once ICU pluralization is supported
            selectedUsers.length === 1 ? 'Title.ConfirmUnbanSingular' : 'Title.ConfirmUnban',
            { numUsers: selectedUsers.length.toString() },
          )}
        />
      </Dialog>
      <UserBansFeedback
        userBansState={userBansState}
        setUserBansState={setUserBansState}
        snackbarMessage={snackbarMessage}
        setSnackbarMessage={setSnackbarMessage}
        listUserIdsError={listUserIdsError}
        setListUserIdsError={setListUserIdsError}
      />
    </Flex>
  );
};

export default withTranslation(UserBansContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.SafetyControls,
  TranslationNamespace.Navigation,
]);
