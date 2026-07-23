import { useCallback } from 'react';
import type { SubjectActionRequest } from '@rbx/client-asset-permissions-api/v1';
import {
  ApiPermissionStatus,
  AssetGrantableAction,
  SubjectType,
} from '@rbx/client-asset-permissions-api/v1';
import { useTranslation } from '@rbx/intl';
import type { TUser } from '@modules/authentication/types';
import assetPermissionsApiClient from '@modules/clients/assetPermissions';
import developClient from '@modules/clients/develop';
import friendsApiClient from '@modules/clients/friends';
import groupsClient from '@modules/clients/groups';
import userProfileApiClient, { COMBINED_NAME_FIELD_MASK } from '@modules/clients/userProfile';
import usersClient from '@modules/clients/users';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { MAX_PAGE_SIZE } from '../../../../../asset/components/asset-permissions/common';
import {
  getAssetPermissions,
  getExperienceDetails,
  getUniverseHasPermission,
} from '../../../common';
import type {
  AssetPermissionResponseModel,
  PermissionAllowedUniverseDetailsType,
} from '../../../types';
import type { DeveloperItemDetails } from '../../../types';
import type { PermissionToastMessage, SharedSubjectDetails } from './types';
import { PermissionAccessLevel, PermissionProcessType } from './types';

export interface AssetPermissionsContext {
  fetchExistingAndPotentialCollaborators: (
    enableSharingWithGroups: boolean,
  ) => Promise<SharedSubjectDetails[]>;
  submitProposedCollaboratorAccess: (changedCollaborators: SharedSubjectDetails[]) => Promise<{
    usersGrantSucceeded: boolean;
    groupsGrantSucceeded: boolean;
    toastMessages: PermissionToastMessage[];
  }>;
  removeStoredCollaboratorAccess: (
    collaborator: SharedSubjectDetails,
  ) => Promise<{ succeeded: boolean; toastMessage: PermissionToastMessage }>;
  validateProposedExperiences: (
    search: string,
    existingProposedExperiences: SharedSubjectDetails[],
  ) => Promise<{ validProposedExperiences: SharedSubjectDetails[]; errors: string[] }>;
  submitProposedExperienceAccess: (
    proposedExperiences: SharedSubjectDetails[],
  ) => Promise<{ succeeded: boolean; toastMessage: PermissionToastMessage }>;
}

const permissionAccessLevelToAssetGrantableAction = (
  permissionAccessLevel: PermissionAccessLevel,
) => {
  switch (permissionAccessLevel) {
    case PermissionAccessLevel.EDIT:
      return AssetGrantableAction.Edit;
    case PermissionAccessLevel.USE:
      return AssetGrantableAction.Use;
    default:
      throw new Error('Invalid permission access level');
  }
};

const assetGrantableActionToPermissionAccessLevel = (
  assetGrantableAction: AssetGrantableAction,
) => {
  switch (assetGrantableAction) {
    case AssetGrantableAction.Edit:
      return PermissionAccessLevel.EDIT;
    case AssetGrantableAction.Use:
      return PermissionAccessLevel.USE;
    default:
      throw new Error('Invalid asset grantable action');
  }
};

const chooseSingularOrPluralTranslation = (
  singularTranslation: string,
  pluralTranslation: string,
  numElements: number,
) => {
  if (numElements === 1) {
    return singularTranslation;
  }
  return pluralTranslation;
};

const validateAndCleanExperienceIdSearch = (search: string) => {
  // Validate that the input only has digits and commas
  const isValid = search.match(/^[0-9,\s\b]*$/);

  if (!isValid) {
    return null;
  }

  const cleanedInput = search
    .replaceAll(/\s/g, '') // Remove all whitespace
    .replace(/,+\s*$/, '') // Remove double and trailing commas
    .trim();

  return cleanedInput;
};

const splitExperienceIds = (cleanedInput: string) => {
  return Array.from(
    // This splits the input by commas to get all the experience ids
    new Set(cleanedInput.split(/[,]+/).map((id) => Number(id))),
    (value) => value,
  );
};

const useAssetPermissions = (
  developerItemDetails: DeveloperItemDetails,
  user: TUser,
): AssetPermissionsContext => {
  const { translate } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  // SHARED HELPER CALLBACKS

  const groupIsCreator = useCallback(
    (groupId: number) => {
      return (
        developerItemDetails.creator.type === SubjectType.Group &&
        groupId === developerItemDetails.creator.id
      );
    },
    [developerItemDetails.creator],
  );

  const emitSuccessEvent = useCallback(
    (count: number, subjectType: SubjectType, permissionProcessType: PermissionProcessType) => {
      const eventName = (() => {
        switch (subjectType) {
          case SubjectType.User:
            return permissionProcessType === PermissionProcessType.Grant
              ? 'clickSaveChanges.asset.permissions.userGrantSuccess'
              : 'clickSaveChanges.asset.permissions.usersRevokeSuccess';
          case SubjectType.Group:
            return permissionProcessType === PermissionProcessType.Grant
              ? 'clickSaveChanges.asset.permissions.groupsGrantSuccess'
              : 'clickSaveChanges.asset.permissions.groupsRevokeSuccess';
          case SubjectType.Universe:
            // Revoke experience permission is not supported
            return 'clickSaveChanges.asset.permissions.experienceGrantSuccess';
          default:
            throw new Error('Invalid subject type');
        }
      })(); // Immediately invoke switch statement as inline switch statements aren't supported in TypeScript

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

  const processPermissions = useCallback(
    async (
      subjectType: SubjectType,
      permissionProcessType: PermissionProcessType,
      requestArray: SubjectActionRequest[],
      successMessage: string,
    ): Promise<{ succeeded: boolean; toastMessage: PermissionToastMessage }> => {
      // Default to failure state
      let succeeded = false;
      let toastMessage = {
        isSuccess: false,
        title: translate('Error.PermissionNotSaved'),
        description: translate('Error.FieldsNotSaved'),
      };

      try {
        const assetId = Number(developerItemDetails.id);
        if (permissionProcessType === PermissionProcessType.Grant) {
          // When granting a Universe permission to an asset, grant to dependencies for composites until we have game session store.
          // For user/group collaborators, access should only be granted for the parent asset.
          const grantToDependencies = subjectType === SubjectType.Universe;
          // Use the default parent version number
          const parentVersionNumber = undefined;
          // This call is made from the asset configuration page, so the Creator should already have direct access to the asset.
          const enableDeepAccessCheck = false;
          /*
           * We cannot use the batchGrantAssetPermissions endpoint as that is
           * designed to grant a single subject permission to multiple assets.
           *
           * Here, we need to grant multiple subjects permission to a single
           * asset, which is only possible with the grantAssetPermissions endpoint.
           */
          await assetPermissionsApiClient.grantAssetPermissions(
            assetId,
            requestArray,
            grantToDependencies,
            parentVersionNumber,
            enableDeepAccessCheck,
          );
        } else {
          await assetPermissionsApiClient.revokeAssetPermissions(assetId, requestArray);
        }
        succeeded = true;
        toastMessage = {
          isSuccess: true,
          title: translate('Message.ChangeSaved'),
          description: successMessage,
        };
        emitSuccessEvent(requestArray.length, subjectType, permissionProcessType);
      } catch {
        emitFailureEvent();
      }

      return { succeeded, toastMessage };
    },
    [developerItemDetails.id, emitFailureEvent, emitSuccessEvent, translate],
  );

  // COLLABORATORS

  const fetchExistingAndPotentialCollaborators = useCallback(
    async (enableSharingWithGroups: boolean): Promise<SharedSubjectDetails[]> => {
      const fetchedUserCollaboratorsMap: Map<number, SharedSubjectDetails> = new Map();
      const fetchedGroupCollaboratorsMap: Map<number, SharedSubjectDetails> = new Map();
      let sharedCollaborators: AssetPermissionResponseModel[] = [];

      try {
        const userFriends = await friendsApiClient.getUsersFriends(user.id);
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
            fetchedUserCollaboratorsMap.set(friend.userId, {
              // The access levels are populated below following a separate API call
              proposedAccessLevel: PermissionAccessLevel.NONE,
              storedAccessLevel: PermissionAccessLevel.NONE,
              subjectId: friend.userId,
              subjectName: friend.names.combinedName || '',
              subjectUsername: friend.names.username || friend.names.combinedName || '',
              subjectType: SubjectType.User,
            });
          }
        });
      } catch {
        // Fail gracefully and don't show any results
      }

      if (enableSharingWithGroups) {
        try {
          const userGroups = await groupsClient.getUsersGroupRoles(user.id);
          userGroups.data?.forEach((group) => {
            if (group.group?.id && group.group?.name && !groupIsCreator(group.group.id)) {
              fetchedGroupCollaboratorsMap.set(group.group.id, {
                // The access levels are populated below following a separate API call
                proposedAccessLevel: PermissionAccessLevel.NONE,
                storedAccessLevel: PermissionAccessLevel.NONE,
                subjectId: group.group.id,
                subjectName: group.group.name,
                subjectType: SubjectType.Group,
              });
            }
          });
        } catch {
          // Fail gracefully and don't show any results
        }
      }

      try {
        sharedCollaborators = await getAssetPermissions(Number(developerItemDetails.id));
      } catch {
        // Don't populate permission tables if error fetching permissions
      }

      const sharedUsersMap = new Map<number, PermissionAccessLevel>();
      sharedCollaborators
        .filter((permission) => permission.subjectType === SubjectType.User)
        .map((permission) => {
          const permissionAccessLevel = assetGrantableActionToPermissionAccessLevel(
            permission.action ?? AssetGrantableAction.Invalid,
          );
          return sharedUsersMap.set(Number(permission.subjectId), permissionAccessLevel);
        });
      const sharedUsersIds = Array.from(sharedUsersMap.keys());

      try {
        const users = await usersClient.getUsersByIds(sharedUsersIds);
        users.data?.forEach((subject) => {
          // Exclude the current user from the existing collaborators
          if (subject.id && subject.id !== user.id && (subject.displayName || subject.name)) {
            const currentAccess = sharedUsersMap.get(subject.id) ?? PermissionAccessLevel.NONE;
            fetchedUserCollaboratorsMap.set(subject.id, {
              proposedAccessLevel: currentAccess,
              storedAccessLevel: currentAccess,
              subjectId: subject.id,
              // For the name and username, we fallback to the other field if one is missing
              subjectName: subject.displayName || subject.name || '',
              subjectUsername: subject.name || subject.displayName || '',
              subjectType: SubjectType.User,
            });
          }
        });
      } catch {
        // Fail gracefully and don't add users to list
      }

      // Even if enableSharingWithGroups is false,
      // we still want to fetch existing group collaborators
      const sharedGroupsMap = new Map<number, PermissionAccessLevel>();
      sharedCollaborators
        .filter(
          (permission) =>
            permission.subjectType === SubjectType.Group &&
            !groupIsCreator(Number(permission.subjectId)),
        )
        .map((permission) => {
          const permissionAccessLevel = assetGrantableActionToPermissionAccessLevel(
            permission.action ?? AssetGrantableAction.Invalid,
          );
          return sharedGroupsMap.set(Number(permission.subjectId), permissionAccessLevel);
        });
      const sharedGroupIds = Array.from(sharedGroupsMap.keys());

      try {
        const groupDetails =
          sharedGroupIds.length > 0 ? await groupsClient.getGroupsInfo(sharedGroupIds) : undefined;
        groupDetails?.data?.forEach((subject) => {
          if (subject.id && subject.name) {
            const currentAccess = sharedGroupsMap.get(subject.id) ?? PermissionAccessLevel.NONE;
            fetchedGroupCollaboratorsMap.set(subject.id, {
              proposedAccessLevel: currentAccess,
              storedAccessLevel: currentAccess,
              subjectId: subject.id,
              subjectName: subject.name,
              subjectType: SubjectType.Group,
            });
          }
        });
      } catch {
        // Fail gracefully and don't add groups to list
      }

      const fetchedUserCollaborators = Array.from(fetchedUserCollaboratorsMap.values());
      const fetchedGroupCollaborators = Array.from(fetchedGroupCollaboratorsMap.values());
      return [...fetchedUserCollaborators, ...fetchedGroupCollaborators];
    },
    [developerItemDetails.id, groupIsCreator, user.id],
  );

  const submitProposedCollaboratorAccess = useCallback(
    async (
      changedCollaborators: SharedSubjectDetails[],
    ): Promise<{
      usersGrantSucceeded: boolean;
      groupsGrantSucceeded: boolean;
      toastMessages: PermissionToastMessage[];
    }> => {
      let usersGrantSucceeded = false;
      let groupsGrantSucceeded = false;
      const toastMessages: PermissionToastMessage[] = [];

      const usersGrantRequest: SubjectActionRequest[] = [];
      const groupsGrantRequest: SubjectActionRequest[] = [];

      changedCollaborators.forEach((collaborator) => {
        const request = {
          subjectId: collaborator.subjectId.toString(),
          action: permissionAccessLevelToAssetGrantableAction(collaborator.proposedAccessLevel),
          subjectType: collaborator.subjectType,
        };
        if (collaborator.subjectType === SubjectType.User) {
          usersGrantRequest.push(request);
        } else if (collaborator.subjectType === SubjectType.Group) {
          groupsGrantRequest.push(request);
        }
      });

      if (usersGrantRequest.length > 0) {
        const { succeeded, toastMessage } = await processPermissions(
          SubjectType.User,
          PermissionProcessType.Grant,
          usersGrantRequest,
          chooseSingularOrPluralTranslation(
            translate('Message.PermissionGivenCreator', {
              number: usersGrantRequest.length.toString(),
            }),
            translate('Message.PermissionGivenCreators', {
              number: usersGrantRequest.length.toString(),
            }),
            usersGrantRequest.length,
          ),
        );

        usersGrantSucceeded = succeeded;
        toastMessages.push(toastMessage);
      }

      if (groupsGrantRequest.length > 0) {
        const { succeeded, toastMessage } = await processPermissions(
          SubjectType.Group,
          PermissionProcessType.Grant,
          groupsGrantRequest,
          chooseSingularOrPluralTranslation(
            translate('Message.PermissionGivenGroup', {
              number: groupsGrantRequest.length.toString(),
            }),
            translate('Message.PermissionGivenGroups', {
              number: groupsGrantRequest.length.toString(),
            }),
            groupsGrantRequest.length,
          ),
        );

        groupsGrantSucceeded = succeeded;
        toastMessages.push(toastMessage);
      }

      return {
        usersGrantSucceeded,
        groupsGrantSucceeded,
        toastMessages,
      };
    },
    [processPermissions, translate],
  );

  const removeStoredCollaboratorAccess = useCallback(
    async (
      collaborator: SharedSubjectDetails,
    ): Promise<{ succeeded: boolean; toastMessage: PermissionToastMessage }> => {
      const requestArray = [
        {
          subjectId: collaborator.subjectId.toString(),
          action: permissionAccessLevelToAssetGrantableAction(collaborator.storedAccessLevel),
          subjectType: collaborator.subjectType,
        },
      ];

      const successMessage =
        collaborator.subjectType === SubjectType.User
          ? chooseSingularOrPluralTranslation(
              translate('Message.PermissionRemovedCreator', {
                number: requestArray.length.toString(),
              }),
              translate('Message.PermissionRemovedCreators', {
                number: requestArray.length.toString(),
              }),
              requestArray.length,
            )
          : chooseSingularOrPluralTranslation(
              translate('Message.PermissionRemovedGroups', {
                number: requestArray.length.toString(),
              }),
              translate('Message.PermissionRemovedGroups', {
                number: requestArray.length.toString(),
              }),
              requestArray.length,
            );

      const { succeeded, toastMessage } = await processPermissions(
        collaborator.subjectType,
        PermissionProcessType.Revoke,
        requestArray,
        successMessage,
      );

      return { succeeded, toastMessage };
    },
    [processPermissions, translate],
  );

  // EXPERIENCES

  const validateProposedExperiences = useCallback(
    async (
      search: string,
      existingProposedExperiences: SharedSubjectDetails[],
    ): Promise<{
      validProposedExperiences: SharedSubjectDetails[];
      errors: string[];
    }> => {
      const validProposedExperiences: SharedSubjectDetails[] = [];
      const errors: string[] = [];

      // Clean input
      const cleanedInput = validateAndCleanExperienceIdSearch(search);
      if (!cleanedInput) {
        errors.push(translate('Error.InvalidFormat'));
        return { validProposedExperiences, errors };
      }

      // Split input
      let uniqueExperienceIds = splitExperienceIds(cleanedInput);
      if (uniqueExperienceIds.length > MAX_PAGE_SIZE) {
        errors.push(
          translate('Error.IdLimitExceeded', {
            limit: MAX_PAGE_SIZE.toString(),
          }),
        );
        return { validProposedExperiences, errors };
      }

      // Filter out experiences that were already proposed
      const existingProposedExperienceIds = new Set(
        existingProposedExperiences.map((experience) => experience.subjectId),
      );
      uniqueExperienceIds = uniqueExperienceIds.filter(
        (experienceId) => !existingProposedExperienceIds.has(experienceId),
      );
      if (uniqueExperienceIds.length === 0) {
        return { validProposedExperiences, errors };
      }

      try {
        const experienceDetails = await getExperienceDetails(uniqueExperienceIds);

        // Determine which Experiences are valid and which are invalid
        const validExperiences: number[] = [];
        const invalidExperiences: number[] = [];
        uniqueExperienceIds.forEach((experienceId) => {
          if (experienceDetails?.find((value) => value.universeId === experienceId)) {
            validExperiences.push(experienceId);
          } else {
            invalidExperiences.push(experienceId);
          }
        });

        // Handle invalid Experiences
        if (invalidExperiences.length > 0) {
          errors.push(
            chooseSingularOrPluralTranslation(
              translate('Error.IdsDoesNotExist', { id: invalidExperiences.join(', ') }),
              translate('Error.IdsDoNotExist', { ids: invalidExperiences.join(', ') }),
              invalidExperiences.length,
            ),
          );
        }

        // Handle no valid Experiences
        if (validExperiences.length === 0) {
          return { validProposedExperiences, errors };
        }

        const experiencePermissions =
          await developClient.getUserUniversePermissions(validExperiences);

        // Determine which Experiences the user does and does not have permission to manage
        const experiencesWithoutPermission: number[] = [];
        const experiencesWithPermission: number[] = [];
        validExperiences.forEach((universeId) => {
          if (
            experiencePermissions.data?.find((value) => value.universeId === universeId)?.canManage
          ) {
            experiencesWithPermission.push(universeId);
          } else {
            experiencesWithoutPermission.push(universeId);
          }
        });

        // Handle Experiences without permission
        if (experiencesWithoutPermission.length > 0) {
          errors.push(
            translate('Error.NoPermissionIds', { ids: experiencesWithoutPermission.join(', ') }),
          );
        }

        if (experiencesWithPermission.length > 0) {
          // Determine which Experiences already have access
          const experienceAccess = await getUniverseHasPermission(
            Number(developerItemDetails.id),
            experiencesWithPermission,
          );

          experiencesWithPermission.forEach((value, index) => {
            const permissionAlreadyExists =
              experienceAccess?.at(index)?.value?.status === ApiPermissionStatus.HasPermission;

            const details = experienceDetails?.find(
              (detail) => detail.universeId === value,
            ) as PermissionAllowedUniverseDetailsType;

            validProposedExperiences.push({
              proposedAccessLevel: PermissionAccessLevel.USE,
              // If an Experience already has access, set the storedAccessLevel accordingly
              // Unlike with Collaborators, we don't prefetch this information
              // This is only checked when the user proposes access for an Experience
              storedAccessLevel: permissionAlreadyExists
                ? PermissionAccessLevel.USE
                : PermissionAccessLevel.NONE,
              subjectId: details.universeId,
              subjectName: details.experienceName,
              subjectType: SubjectType.Universe,
            });
          });
        }
      } catch {
        errors.push(translate('Error.FetchUniverseDetailsFailed'));
      }
      return { validProposedExperiences, errors };
    },
    [developerItemDetails.id, translate],
  );

  const submitProposedExperienceAccess = useCallback(
    async (
      proposedExperiences: SharedSubjectDetails[],
    ): Promise<{ succeeded: boolean; toastMessage: PermissionToastMessage }> => {
      const experienceGrantRequest = proposedExperiences.map((experience) => {
        return {
          subjectId: experience.subjectId.toString(),
          action: permissionAccessLevelToAssetGrantableAction(experience.proposedAccessLevel),
          subjectType: experience.subjectType,
        };
      });

      const { succeeded, toastMessage } = await processPermissions(
        SubjectType.Universe,
        PermissionProcessType.Grant,
        experienceGrantRequest,
        chooseSingularOrPluralTranslation(
          translate('Message.PermissionGivenExperience', {
            number: experienceGrantRequest.length.toString(),
          }),
          // TODO: Change "ids" to "number" for consistency after redesign migration
          translate('Message.PermissionGivenExperiences', {
            ids: experienceGrantRequest.length.toString(),
          }),
          experienceGrantRequest.length,
        ),
      );

      return { succeeded, toastMessage };
    },
    [processPermissions, translate],
  );

  return {
    fetchExistingAndPotentialCollaborators,
    submitProposedCollaboratorAccess,
    removeStoredCollaboratorAccess,
    validateProposedExperiences,
    submitProposedExperienceAccess,
  };
};

export default useAssetPermissions;
