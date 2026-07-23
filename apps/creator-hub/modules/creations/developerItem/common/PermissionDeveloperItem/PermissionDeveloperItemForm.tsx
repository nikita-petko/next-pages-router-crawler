import {
  assetPermissionsApiClient,
  developClient,
  groupsClient,
  usersClient,
} from '@modules/clients';
import friendsApiClient from '@modules/clients/friends';
import { CreatorType, urls } from '@modules/miscellaneous/common';
import {
  ASSET_ACCESS_PRIVACY,
  GROUP_HOME_URL,
} from '@modules/miscellaneous/common/constants/linkConstants';
import {
  ApiPermissionStatus,
  AssetConsumerAction,
  AssetGrantableAction,
  SubjectActionRequest,
  SubjectType,
} from '@rbx/clients/assetPermissionsApi';
import { useTranslation } from '@rbx/intl';
import {
  Alert,
  Avatar,
  Button,
  CloseIcon,
  Grid,
  IconButton,
  Link,
  TAvatarProps,
  Typography,
  useSnackbar,
} from '@rbx/ui';
import { useRouter } from 'next/router';
import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import type { TUser } from '@modules/authentication/types';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import userProfileApiClient, { COMBINED_NAME_FIELD_MASK } from '@modules/clients/userProfile';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import { MAX_PAGE_SIZE } from '../../../asset/components/asset-permissions/common';
import { DeveloperItemDetails } from '../DeveloperItemProvider';
import usePermissionDeveloperItemContainerStyles from './PermissionDeveloperItemForm.styles';
import PermissionDeveloperItemTable, {
  SharedSubjectDetails,
  SubjectModification,
} from './components/PermissionDeveloperItemTable';

import {
  getAssetPermissions,
  getBackToCreationsPageLink,
  getExperienceDetails,
  getUniverseHasPermission,
} from '../common';
import { AssetPermissionResponseModel, PermissionAllowedUniverseDetailsType } from '../types';
import CollaboratorAutocomplete from './components/CollaboratorAutocomplete';
import ExperienceSearchBar from './components/ExperienceSearchBar';

const creatorShareAssetLimit = 200;
const groupShareAssetLimit = 100;
const { www } = urls;
export type PermissionDeveloperItemFormProps = {
  developerItemDetails: DeveloperItemDetails;
  user: TUser;
};

const PermissionDeveloperItemForm: FunctionComponent<
  React.PropsWithChildren<PermissionDeveloperItemFormProps>
> = ({ developerItemDetails, user }) => {
  const {
    classes: {
      actionContainer,
      actionContainerParent,
      alert,
      buttonText,
      container,
      iconButton,
      sectionHeader,
      subSectionHeading,
    },
  } = usePermissionDeveloperItemContainerStyles();
  const [existingExperiences, setExistingExperiences] = useState<Map<number, SharedSubjectDetails>>(
    new Map(),
  );
  const [experienceInputError, setExperienceInputError] = useState<string[]>([]);
  const [isAddingToListLoading, setIsAddingToListLoading] = useState<boolean>(false);
  const [addFriendError, setAddFriendError] = useState<boolean>(false);
  const [addGroupError, setAddGroupError] = useState<boolean>(false);
  const [creatorList, setCreatorList] = useState<Map<number, SharedSubjectDetails>>(new Map());
  const [groupsList, setGroupsList] = useState<Map<number, SharedSubjectDetails>>(new Map());
  const [myFriends, setMyFriends] = useState<Set<number>>(new Set());
  const [myGroups, setMyGroups] = useState<Set<number>>(new Set());
  const { translate, translateHTML } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { frontendFlags } = useToolboxServiceApiProvider();
  const enableSharingWithGroups =
    frontendFlags[FrontendFlagName.FrontendFlagEnablePermissionSharingWithGroups];

  const createThumbnail = (id: number, type: ThumbnailTypes, variant: TAvatarProps['variant']) => {
    return (
      <Avatar variant={variant} alt=''>
        <Thumbnail2d targetId={id} type={type} alt='' returnPolicy={ReturnPolicy.PlaceHolder} />
      </Avatar>
    );
  };

  const emitSuccessEvent = useCallback(
    (count: number, eventName: string) => {
      unifiedLogger.logClickEvent({
        eventName,
        parameters: {
          count: count.toString(),
        },
      });
    },
    [unifiedLogger],
  );

  const emitFailureEvent = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: 'clickSaveChanges.asset.permissions.failure',
    });
  }, [unifiedLogger]);

  // This will not be the default as this is checked by the container
  const userId = user.id ?? 0;
  const initializeData = useCallback(async () => {
    const creators: Map<number, SharedSubjectDetails> = new Map();
    const groups: Map<number, SharedSubjectDetails> = new Map();
    let sharedCollaborators: AssetPermissionResponseModel[] = [];
    const friendSet: Set<number> = new Set();
    const groupSet: Set<number> = new Set();

    try {
      const userFriends = await friendsApiClient.getUsersFriends(userId);
      const userFriendsIds =
        userFriends
          ?.map((friend) => friend.id)
          .filter((id): id is number => id !== undefined)
          .map((id) => String(id)) ?? [];

      const userFriendsProfiles =
        userFriendsIds?.length > 0
          ? await userProfileApiClient.getUserProfiles(userFriendsIds, COMBINED_NAME_FIELD_MASK)
          : [];

      userFriendsProfiles?.forEach((friend) => {
        if (friend.userId && friend?.names?.combinedName) {
          friendSet.add(friend.userId);
          creators.set(friend.userId, {
            subjectId: friend.userId,
            subjectName: friend.names.combinedName || '',
            access: AssetConsumerAction.Use,
            canRemoved: false,
            thumbnail: createThumbnail(friend.userId, ThumbnailTypes.avatarHeadshot, 'circular'),
          });
        }
      });
    } catch {
      // Fail gracefully and don't show any results
    }
    try {
      if (enableSharingWithGroups) {
        const userGroups = await groupsClient.getUsersGroupRoles(userId);
        userGroups.data?.forEach((group) => {
          if (group.group?.id && group.group?.name) {
            groupSet.add(group.group.id);
            groups.set(group.group.id, {
              subjectId: group.group.id,
              subjectName: group.group.name,
              access: AssetConsumerAction.Use,
              canRemoved: false,
              thumbnail: createThumbnail(group.group.id, ThumbnailTypes.groupIcon, 'circular'),
            });
          }
        });
      }
    } catch {
      // If fetching users groups fail don't populate results
    }
    try {
      sharedCollaborators = await getAssetPermissions(Number(developerItemDetails.id));
    } catch {
      // Don't populate permission tables if error fetching permissions
    }
    if (developerItemDetails.creator.type === CreatorType.Group) {
      creators.set(userId, {
        subjectId: userId,
        subjectName: user.displayName || user.name || '',
        access: AssetConsumerAction.Use,
        canRemoved: false,
        thumbnail: createThumbnail(userId, ThumbnailTypes.avatarHeadshot, 'circular'),
      });
      friendSet.add(userId);
    }
    const sharedUsers = sharedCollaborators
      .filter((permission) => permission.subjectType === SubjectType.User)
      .map((permission) => Number(permission.subjectId));
    const sharedGroups = sharedCollaborators
      .filter((permission) => permission.subjectType === SubjectType.Group)
      .map((permission) => Number(permission.subjectId));
    try {
      const users = await usersClient.getUsersByIds(sharedUsers);
      users.data?.forEach((subject) => {
        if (subject.id && (subject.displayName || subject.name)) {
          creators.set(subject.id, {
            subjectId: subject.id,
            subjectName: subject.displayName || subject.name || '',
            access: AssetConsumerAction.Use,
            canRemoved: true,
            thumbnail: createThumbnail(subject.id, ThumbnailTypes.avatarHeadshot, 'circular'),
          });
        }
      });
    } catch {
      // Fail gracefully and don't add users to list
    }
    try {
      const groupDetails =
        sharedGroups.length > 0 ? await groupsClient.getGroupsInfo(sharedGroups) : undefined;
      groupDetails?.data?.forEach((group) => {
        if (group.id && group.name) {
          groups.set(group.id, {
            subjectId: group.id,
            subjectName: group.name,
            access: AssetConsumerAction.Use,
            canRemoved: true,
            thumbnail: createThumbnail(group.id, ThumbnailTypes.groupIcon, 'circular'),
          });
        }
      });
    } catch {
      // Fail gracefully and don't add groups to list
    }
    setMyFriends(friendSet);
    setMyGroups(groupSet);
    setCreatorList(creators);
    setGroupsList(groups);
  }, [
    developerItemDetails.creator.type,
    developerItemDetails.id,
    userId,
    enableSharingWithGroups,
    user.displayName,
    user.name,
  ]);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  const generatePluralTranslations = (
    singularTranslation: string,
    pluralTranslation: string,
    numElements: number,
  ) => {
    if (numElements === 1) {
      return singularTranslation;
    }
    return pluralTranslation;
  };

  const { enqueue, close } = useSnackbar();
  const router = useRouter();
  const modifiedExperiences = useMemo(() => {
    const experienceArray = Array.from(existingExperiences.values());
    return experienceArray.filter(
      (value) => value.subjectModification !== undefined && value.subjectModification !== null,
    );
  }, [existingExperiences]);

  const generateMapLists = (list: Map<number, SharedSubjectDetails>, shareableIds: Set<number>) => {
    const listArray = Array.from(list.values());

    const tableList = new Map(
      listArray.filter((item) => item.canRemoved).map((item) => [item.subjectId, item]),
    );
    const optionList = new Map(
      listArray
        .filter((item) => !item.canRemoved && shareableIds.has(item.subjectId))
        .map((item) => [item.subjectId, item]),
    );
    const modifiedList = new Map(
      listArray
        .filter(
          (item) => item.subjectModification !== undefined && item.subjectModification !== null,
        )
        .map((item) => [item.subjectId, item]),
    );

    return [tableList, optionList, modifiedList];
  };

  const [friendTableList, friendOptionList, friendModifiedList] = useMemo(
    () => generateMapLists(creatorList, myFriends),
    [creatorList, myFriends],
  );
  const [groupTableList, groupOptionList, groupModifiedList] = useMemo(
    () => generateMapLists(groupsList, myGroups),
    [groupsList, myGroups],
  );

  const showToast = useCallback(
    (messages: { isSuccess: boolean; key: string; message: React.JSX.Element }[]) => {
      enqueue({
        children: (
          <div>
            {messages.map((value) => {
              if (value.isSuccess) {
                return (
                  <Alert
                    key={value.key}
                    classes={{ root: alert }}
                    severity='success'
                    variant='filled'>
                    {value.message}
                  </Alert>
                );
              }
              return (
                <Alert
                  key={value.key}
                  action={
                    <IconButton
                      aria-label='Close'
                      classes={{ root: iconButton }}
                      color='inherit'
                      onClick={() => close()}
                      size='small'>
                      <CloseIcon />
                    </IconButton>
                  }
                  classes={{ root: alert }}
                  severity='error'
                  variant='filled'>
                  {value.message}
                </Alert>
              );
            })}
          </div>
        ),
        autoHide: true,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
      });
    },
    [alert, close, enqueue, iconButton],
  );

  const createToastMessage = (title: string, description: string) => {
    return (
      <React.Fragment>
        <Grid>
          <Typography component='alert-title'>{title}</Typography>
        </Grid>
        <Grid>
          <Typography component='alert-description'>{description}</Typography>
        </Grid>
      </React.Fragment>
    );
  };

  const onExperienceRemove = useCallback(
    (item: number) => {
      setExistingExperiences((prev) => {
        const newMap = new Map(prev);
        newMap.delete(item);
        return newMap;
      });
      existingExperiences.delete(item);
    },
    [existingExperiences],
  );

  const handleAddUniverseIdsToList = useCallback(
    async (search: string) => {
      const inputErrors: string[] = [];
      setIsAddingToListLoading(true);

      // This validates that the input only has digits and commas
      const isValid = search.match(/^[0-9,\s\b]*$/);

      const cleanedInput = search
        .replace(/\s/g, '') // Remove all whitespace
        .replace(/,+\s*$/, '') // Remove double and trailing commas
        .trim();
      if (!(isValid && cleanedInput)) {
        setExperienceInputError([translate('Error.InvalidFormat')]);
        setIsAddingToListLoading(false);
        return;
      }
      let inputUniqueUniverseIds = Array.from(
        // This splits the input by commas to get all the experience ids
        new Set(cleanedInput.split(/[,]+/).map((id) => Number(id))),
        (value) => value,
      );

      if (inputUniqueUniverseIds.length > MAX_PAGE_SIZE) {
        setExperienceInputError([
          translate('Error.IdLimitExceeded', {
            limit: MAX_PAGE_SIZE.toString(),
          }),
        ]);
        setIsAddingToListLoading(false);
        return;
      }

      inputUniqueUniverseIds = inputUniqueUniverseIds.filter(
        (universeId) => !existingExperiences.get(universeId),
      );
      if (inputUniqueUniverseIds.length === 0) {
        setIsAddingToListLoading(false);
        return;
      }
      try {
        const experienceDetail = await getExperienceDetails(inputUniqueUniverseIds);

        const existingUniverses: number[] = [];
        const nonExistentUniverses: number[] = [];
        inputUniqueUniverseIds.forEach((universeId) => {
          if (experienceDetail?.find((value) => value.universeId === universeId)) {
            existingUniverses.push(universeId);
          } else {
            nonExistentUniverses.push(universeId);
          }
        });

        if (nonExistentUniverses.length > 0) {
          inputErrors.push(
            generatePluralTranslations(
              translate('Error.IdsDoesNotExist', { id: nonExistentUniverses.join(', ') }),
              translate('Error.IdsDoNotExist', { ids: nonExistentUniverses.join(', ') }),
              nonExistentUniverses.length,
            ),
          );
        }
        if (existingUniverses.length === 0) {
          setIsAddingToListLoading(false);
          setExperienceInputError(inputErrors);
          return;
        }

        const universePermissions =
          await developClient.getUserUniversePermissions(existingUniverses);

        const universesWithoutPermission: number[] = [];
        const universesWithPermission: number[] = [];
        existingUniverses.forEach((universeId) => {
          if (
            universePermissions.data?.find((value) => value.universeId === universeId)?.canManage
          ) {
            universesWithPermission.push(universeId);
          } else {
            universesWithoutPermission.push(universeId);
          }
        });

        if (universesWithoutPermission.length > 0) {
          inputErrors.push(
            translate('Error.NoPermissionIds', { ids: universesWithoutPermission.join(', ') }),
          );
        }

        // If universe has view permission add it to list without ability to remove
        if (universesWithPermission.length > 0) {
          const experienceAccess = await getUniverseHasPermission(
            Number(developerItemDetails.id),
            universesWithPermission,
          );
          setExistingExperiences((prev) => {
            const newMap = new Map(prev);
            universesWithPermission.forEach((value, index) => {
              const permissionExists =
                experienceAccess?.at(index)?.value?.status === ApiPermissionStatus.HasPermission;
              const details = experienceDetail?.find(
                (detail) => detail.universeId === value,
              ) as PermissionAllowedUniverseDetailsType;
              newMap.set(details.universeId, {
                subjectId: details.universeId,
                subjectModification: permissionExists ? undefined : SubjectModification.Added,
                subjectName: details.experienceName,
                canRemoved: !permissionExists,
                access: AssetConsumerAction.Use,
                thumbnail: createThumbnail(details.universeId, ThumbnailTypes.gameIcon, 'square'),
              });
            });
            return newMap;
          });
        }
        setExperienceInputError(inputErrors);
      } catch {
        setExperienceInputError([translate('Error.FetchUniverseDetailsFailed')]);
      } finally {
        setIsAddingToListLoading(false);
      }
    },
    [developerItemDetails.id, existingExperiences, translate],
  );

  const addCollaboratorPermission = (
    listLimit: number,
    setError: React.Dispatch<React.SetStateAction<boolean>>,
    setSubjectList: React.Dispatch<React.SetStateAction<Map<number, SharedSubjectDetails>>>,
    subjectId: number,
    tableList: Map<number, SharedSubjectDetails>,
  ) => {
    if (tableList.size >= listLimit) {
      setError(true);
    } else {
      setSubjectList((prev) => {
        const newMap = new Map(prev);
        const updatedSubject = newMap.get(subjectId);
        if (updatedSubject) {
          updatedSubject.canRemoved = true;
          // When subject is initially in removed state and is added again it should be set back to undefined/unchanged
          updatedSubject.subjectModification =
            updatedSubject.subjectModification === undefined ||
            updatedSubject.subjectModification === null
              ? SubjectModification.Added
              : undefined;
          return newMap;
        }
        return prev;
      });
    }
  };
  const addFriendPermission = useCallback(
    (friendId: number) => {
      addCollaboratorPermission(
        creatorShareAssetLimit,
        setAddFriendError,
        setCreatorList,
        friendId,
        friendTableList,
      );
    },
    [friendTableList, setAddFriendError, setCreatorList],
  );

  const addGroupPermission = useCallback(
    (groupId: number) => {
      addCollaboratorPermission(
        groupShareAssetLimit,
        setAddGroupError,
        setGroupsList,
        groupId,
        groupTableList,
      );
    },
    [groupTableList, setAddGroupError, setGroupsList],
  );

  const removeCollaboratorPermission = (
    errorEnabled: boolean,
    setError: React.Dispatch<React.SetStateAction<boolean>>,
    subjectId: number,
    setSubjectList: React.Dispatch<React.SetStateAction<Map<number, SharedSubjectDetails>>>,
  ) => {
    setSubjectList((prev) => {
      const newMap = new Map(prev);
      const updatedSubject = newMap.get(subjectId);
      if (updatedSubject) {
        updatedSubject.canRemoved = false;
        updatedSubject.subjectModification =
          updatedSubject.subjectModification === undefined ||
          updatedSubject.subjectModification === null
            ? SubjectModification.Removed
            : undefined;
        return newMap;
      }
      return prev;
    });
    // Once removing an entry for the table the limit reached message should be reset
    if (errorEnabled) {
      setError(false);
    }
  };

  const removeFriendPermission = useCallback(
    (friendId: number) => {
      removeCollaboratorPermission(addFriendError, setAddFriendError, friendId, setCreatorList);
    },
    [addFriendError, setCreatorList],
  );

  const removeGroupPermission = useCallback(
    (groupId: number) => {
      removeCollaboratorPermission(addGroupError, setAddGroupError, groupId, setGroupsList);
    },
    [addGroupError, setGroupsList],
  );

  const processPermissions = useCallback(
    async (
      apiFunction: (
        assetId: number,
        subjectActionsRequest?: SubjectActionRequest[] | undefined,
      ) => Promise<object>,
      requestArray: { action: AssetGrantableAction; subjectId: string; subjectType: SubjectType }[],
      setSubjectList: React.Dispatch<React.SetStateAction<Map<number, SharedSubjectDetails>>>,
      successMessage: string,
      toastMessages: { isSuccess: boolean; key: string; message: React.JSX.Element }[],
      eventName: string,
      emitEvent: (count: number, eventName: string) => void,
    ) => {
      if (requestArray.length > 0) {
        await apiFunction(Number(developerItemDetails.id), requestArray);

        toastMessages.push({
          isSuccess: true,
          key: successMessage,
          message: createToastMessage(translate('Message.ChangeSaved'), successMessage),
        });

        setSubjectList((prev: Map<number, SharedSubjectDetails>) => {
          const newMap = new Map(prev);
          requestArray.forEach((value) => {
            const subject = newMap.get(Number(value.subjectId));
            if (subject) {
              subject.subjectModification = undefined;
              if (value.subjectType === SubjectType.Universe) {
                subject.canRemoved = false;
              }
            }
          });
          return newMap;
        });
        emitEvent(requestArray.length, eventName);
      }
    },
    [developerItemDetails.id, translate],
  );

  const handleFormSubmit = useCallback(async () => {
    const toastMessages: { isSuccess: boolean; key: string; message: React.JSX.Element }[] = [];
    const modifiedFriendsArray = Array.from(friendModifiedList.values());
    const modifiedGroupsArray = Array.from(groupModifiedList.values());
    const grantFriends = modifiedFriendsArray.filter(
      (friend) => friend.subjectModification === SubjectModification.Added,
    );
    const revokeFriends = modifiedFriendsArray.filter(
      (friend) => friend.subjectModification === SubjectModification.Removed,
    );
    const grantGroups = modifiedGroupsArray.filter(
      (group) => group.subjectModification === SubjectModification.Added,
    );
    const revokeGroups = modifiedGroupsArray.filter(
      (group) => group.subjectModification === SubjectModification.Removed,
    );
    const grantUniverseRequest = modifiedExperiences.map((value) => {
      return {
        subjectId: value.subjectId.toString(),
        action: AssetGrantableAction.Use,
        subjectType: SubjectType.Universe,
      };
    });

    const grantFriendRequest = grantFriends.map((friend) => {
      return {
        subjectId: friend.subjectId.toString(),
        action: AssetGrantableAction.Use,
        subjectType: SubjectType.User,
      };
    });

    const revokeFriendRequest = revokeFriends.map((friend) => {
      return {
        subjectId: friend.subjectId.toString(),
        action: AssetGrantableAction.Use,
        subjectType: SubjectType.User,
      };
    });

    const grantGroupRequest = grantGroups.map((group) => {
      return {
        subjectId: group.subjectId.toString(),
        action: AssetGrantableAction.Use,
        subjectType: SubjectType.Group,
      };
    });

    const revokeGroupRequest = revokeGroups.map((group) => {
      return {
        subjectId: group.subjectId.toString(),
        action: AssetGrantableAction.Use,
        subjectType: SubjectType.Group,
      };
    });

    try {
      await processPermissions(
        assetPermissionsApiClient.grantAssetPermissions,
        grantUniverseRequest,
        setExistingExperiences,
        generatePluralTranslations(
          translate('Message.PermissionGivenExperience', {
            number: grantUniverseRequest.length.toString(),
          }),
          translate('Message.PermissionGivenExperiences', {
            ids: grantUniverseRequest.length.toString(),
          }),
          grantUniverseRequest.length,
        ),
        toastMessages,
        'clickSaveChanges.asset.permissions.experienceGrantSuccess',
        emitSuccessEvent,
      );

      await processPermissions(
        assetPermissionsApiClient.grantAssetPermissions,
        grantFriendRequest,
        setCreatorList,
        generatePluralTranslations(
          translate('Message.PermissionGivenCreator', {
            number: grantFriendRequest.length.toString(),
          }),
          translate('Message.PermissionGivenCreators', {
            number: grantFriendRequest.length.toString(),
          }),
          grantFriendRequest.length,
        ),
        toastMessages,
        'clickSaveChanges.asset.permissions.userGrantSuccess',
        emitSuccessEvent,
      );

      await processPermissions(
        assetPermissionsApiClient.revokeAssetPermissions,
        revokeFriendRequest,
        setCreatorList,
        generatePluralTranslations(
          translate('Message.PermissionRemovedCreator', {
            number: revokeFriendRequest.length.toString(),
          }),
          translate('Message.PermissionRemovedCreators', {
            number: revokeFriendRequest.length.toString(),
          }),
          revokeFriendRequest.length,
        ),
        toastMessages,
        'clickSaveChanges.asset.permissions.usersRevokeSuccess',
        emitSuccessEvent,
      );

      await processPermissions(
        assetPermissionsApiClient.grantAssetPermissions,
        grantGroupRequest,
        setGroupsList,
        generatePluralTranslations(
          translate('Message.PermissionGivenGroup', {
            number: grantGroupRequest.length.toString(),
          }),
          translate('Message.PermissionGivenGroups', {
            number: grantGroupRequest.length.toString(),
          }),
          grantGroupRequest.length,
        ),
        toastMessages,
        'clickSaveChanges.asset.permissions.groupsGrantSuccess',
        emitSuccessEvent,
      );

      await processPermissions(
        assetPermissionsApiClient.revokeAssetPermissions,
        revokeGroupRequest,
        setGroupsList,
        generatePluralTranslations(
          translate('Message.PermissionRemovedGroups', {
            number: revokeGroupRequest.length.toString(),
          }),
          translate('Message.PermissionRemovedGroups', {
            number: revokeGroupRequest.length.toString(),
          }),
          revokeGroupRequest.length,
        ),
        toastMessages,
        'clickSaveChanges.asset.permissions.groupsRevokeSuccess',
        emitSuccessEvent,
      );
    } catch {
      toastMessages.push({
        isSuccess: false,
        key: translate('Error.FieldsNotSaved'),
        message: createToastMessage(
          translate('Error.PermissionNotSaved'),
          translate('Error.FieldsNotSaved'),
        ),
      });
      emitFailureEvent();
    } finally {
      showToast(toastMessages);
    }
  }, [
    emitFailureEvent,
    emitSuccessEvent,
    friendModifiedList,
    groupModifiedList,
    modifiedExperiences,
    processPermissions,
    showToast,
    translate,
  ]);

  const handleFormCancel = useCallback(() => {
    if (developerItemDetails) {
      router.push(getBackToCreationsPageLink(developerItemDetails));
    }
  }, [developerItemDetails, router]);

  return (
    <Grid classes={{ root: container }} container>
      <Grid item XSmall={12}>
        <Typography color='primary' variant='h1'>
          {translate('Heading.Permissions')}
        </Typography>
      </Grid>
      <Grid item XSmall={12}>
        <Grid container direction='row' item spacing={2} XSmall={12}>
          <Grid item XSmall={12}>
            <Typography classes={{ root: sectionHeader }} component='h3' variant='h3'>
              {translate('Heading.CollaboratorAccess')}
            </Typography>
          </Grid>
          <Grid item XSmall={9}>
            <Typography variant='body2'>
              {translate('Description.CollaboratorAccess')}
              &nbsp;
            </Typography>
          </Grid>
          <Grid item XSmall={12}>
            <Typography classes={{ root: subSectionHeading }} component='h4' variant='h4'>
              {translate('Heading.Creators')}
            </Typography>
          </Grid>
          <Grid item XSmall={12}>
            <Typography variant='body2'>
              {translateHTML('Message.AccessFriends', [
                {
                  opening: 'linkStart',
                  closing: 'linkEnd',
                  content(chunks) {
                    return <Link href={www.getFriendsUrl(userId)}>{chunks}</Link>;
                  },
                },
              ])}
            </Typography>
          </Grid>
          <Grid item XSmall={12}>
            <CollaboratorAutocomplete
              errorMessage={addFriendError ? translate('Error.ShareLimitReached') : undefined}
              onAutocompleteAdd={addFriendPermission}
              searchLabel={translate('Label.SearchFriends')}
              sharedSubjectDetailsList={friendOptionList}
            />
          </Grid>
          {friendTableList.size > 0 && (
            <Grid item XSmall={12}>
              <PermissionDeveloperItemTable
                data-testid='friend-access-table'
                onItemRemove={removeFriendPermission}
                sharedSubjectDetailsList={friendTableList}
                subject={translate('Label.Creator')}
              />
            </Grid>
          )}
          {enableSharingWithGroups && (
            <React.Fragment>
              <Grid item XSmall={12}>
                <Typography classes={{ root: subSectionHeading }} component='h4' variant='h4'>
                  {translate('Heading.Groups')}
                </Typography>
              </Grid>
              <Grid item XSmall={12}>
                <Typography variant='body2'>
                  {translateHTML('Message.AccessGroups', [
                    {
                      opening: 'linkStart',
                      closing: 'linkEnd',
                      content(chunks) {
                        return <Link href={GROUP_HOME_URL}>{chunks}</Link>;
                      },
                    },
                  ])}
                </Typography>
              </Grid>
              <Grid item XSmall={12}>
                <CollaboratorAutocomplete
                  errorMessage={addGroupError ? translate('Error.ShareLimitReached') : undefined}
                  onAutocompleteAdd={addGroupPermission}
                  searchLabel={translate('Label.SearchGroups')}
                  sharedSubjectDetailsList={groupOptionList}
                />
              </Grid>
              {groupTableList.size > 0 && (
                <Grid item XSmall={12}>
                  <PermissionDeveloperItemTable
                    data-testid='group-access-table'
                    onItemRemove={removeGroupPermission}
                    sharedSubjectDetailsList={groupTableList}
                    subject={translate('Label.Group')}
                  />
                </Grid>
              )}
            </React.Fragment>
          )}
        </Grid>
      </Grid>
      <Grid item XSmall={12}>
        <Grid container direction='row' item spacing={2} XSmall={12}>
          <Grid item XSmall={12}>
            <Typography classes={{ root: sectionHeader }} component='h3' variant='h3'>
              {translate('Heading.ExperienceAccess')}
            </Typography>
          </Grid>
          <Grid item XSmall={9}>
            <Typography variant='body2'>
              {translate('Message.ExperienceAccess')}
              &nbsp;
            </Typography>
          </Grid>
          <Grid item XSmall={12}>
            <Typography variant='body2'>
              {translate('Message.PermissionPermanent')}
              &nbsp;
            </Typography>
            <Link
              aria-label={translate('Link.LearnMore')}
              href={ASSET_ACCESS_PRIVACY}
              target='_blank'>
              {translate('Link.LearnMore')}
            </Link>
          </Grid>
          <Grid container item XSmall={12}>
            <ExperienceSearchBar
              errorList={experienceInputError}
              handleExperienceSubmit={handleAddUniverseIdsToList}
              loading={isAddingToListLoading}
            />
          </Grid>
        </Grid>
        {existingExperiences.size > 0 && (
          <PermissionDeveloperItemTable
            data-testid='experience-access-table'
            onItemRemove={onExperienceRemove}
            sharedSubjectDetailsList={existingExperiences}
            subject={translate('Label.Experience')}
          />
        )}
      </Grid>
      <Grid classes={{ root: actionContainerParent }} container direction='column'>
        <Grid classes={{ root: actionContainer }} container item>
          <Grid item>
            <Button
              classes={{ root: buttonText }}
              color='primary'
              onClick={handleFormCancel}
              variant='outlined'>
              {translate('Action.Cancel')}
            </Button>
          </Grid>
          <Grid item>
            <Button
              classes={{ root: buttonText }}
              color='primary'
              disabled={
                modifiedExperiences.length === 0 &&
                friendModifiedList.size === 0 &&
                groupModifiedList.size === 0
              }
              onClick={handleFormSubmit}
              variant='contained'>
              {translate('Action.SaveChanges')}
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default PermissionDeveloperItemForm;
