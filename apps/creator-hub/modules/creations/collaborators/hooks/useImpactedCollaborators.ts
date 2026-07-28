import { useMemo } from 'react';
import { useAuthentication } from '@modules/authentication/providers';
import type {
  AdminViewEntry,
  EditViewData,
  UniverseCollaborationStatusResponse,
} from '@modules/clients/teamCreateCollaboration';
import type { CollaboratorData, ImpactingCollaboratorData, JoinAttempt } from '../types';
import useGetAvatarHeadshots from './useGetAvatarHeadshots';
import useGetUniverseCollaborationStatus from './useGetUniverseCollaborationStatus';
import useGetUsersByIds from './useGetUsersByIds';

// Fetch username and display name for an array of user IDs and return a mapping of
// user ID to user info (username and display name)
const useUserDataMapping = (
  actingUserId?: number,
  universeCollaborationData?: UniverseCollaborationStatusResponse,
) => {
  // Parse the unique user IDs to fetch data for
  const usersToFetch = new Set<number>();
  (universeCollaborationData?.AdminView ?? []).forEach((collaborator) => {
    usersToFetch.add(collaborator.UserId);
    collaborator.RequiresTrustedConnection.forEach((relatedCollaborator) => {
      usersToFetch.add(relatedCollaborator.UserId);
    });
  });
  (universeCollaborationData?.EditViewUsers ?? []).forEach((collaborator) => {
    usersToFetch.add(collaborator.UserId);
    collaborator.RequiresTrustedConnection.forEach((relatedCollaborator) => {
      usersToFetch.add(relatedCollaborator.UserId);
    });
  });
  (universeCollaborationData?.BlockedUsers ?? []).forEach((collaborator) => {
    usersToFetch.add(collaborator.UserId);
  });
  (universeCollaborationData?.TenuredUsers ?? []).forEach((collaborator) => {
    usersToFetch.add(collaborator);
  });
  if (universeCollaborationData && actingUserId) {
    // This is added conditionally so we don't fetch the user info one with just the acting
    // user while the universeCollaborationData loads.
    usersToFetch.add(actingUserId);
  }

  // Fetch user data and construct a map for lookup
  const {
    data: userData,
    isLoading: isUserDataLoading,
    error,
  } = useGetUsersByIds(Array.from(usersToFetch.values()));
  const { data: thumbnailData } = useGetAvatarHeadshots(Array.from(usersToFetch.values()));

  return useMemo(() => {
    const thumbnailMap = new Map<number, string>();
    (thumbnailData?.data ?? []).forEach((res) => {
      if (res.targetId && res.imageUrl) {
        thumbnailMap.set(res.targetId, res.imageUrl);
      }
    });

    const userDataMap = new Map<number, CollaboratorData>();
    (userData?.data ?? []).forEach((user) => {
      userDataMap.set(user.id ?? 0, {
        userId: user.id ?? 0,
        username: user.name ?? '',
        displayName: user.displayName ?? '',
        thumbnailUrl: thumbnailMap.get(user.id ?? 0),
      });
    });

    return { data: userDataMap, isLoading: isUserDataLoading, error };
  }, [userData, isUserDataLoading, error, thumbnailData]);
};

// Sort collaborators based on who they are impacting/are impacted by (i.e. which tab they should appear under)
// and attach user data (username and display name)
const parseImpactedCollaboratorListsFromResponse = (
  adminView: (AdminViewEntry | EditViewData)[],
  userDataMap: Map<number, CollaboratorData>,
  actingUserId: number,
  actingUserRequiredConnections?: Set<number>,
) => {
  const requiresConnection = adminView;
  const actingUserData = userDataMap.get(actingUserId);

  // Iterate over the list of impacted collaborators and populate the user
  // data using the map constructed above. Sorts collaborators into those impacting
  // the acting user and those not impacting the current user.
  const impactedCollaborators: ImpactingCollaboratorData[] = [];
  const impactingMe: ImpactingCollaboratorData[] = [];
  const impactingOthers: ImpactingCollaboratorData[] = [];
  requiresConnection.forEach((connection) => {
    const userData = userDataMap.get(connection.UserId);
    if (!userData) {
      return;
    }
    const impactedConnections: CollaboratorData[] = [];

    // Assemble user data for collaborators in RequiresTrustedConnection
    let actingUserIsImpacting = false;
    connection.RequiresTrustedConnection.forEach((relatedCollaborator) => {
      const relatedCollaboratorData = userDataMap.get(relatedCollaborator.UserId);
      if (relatedCollaboratorData) {
        impactedConnections.push(relatedCollaboratorData);
      }
      if (relatedCollaborator.UserId === actingUserId) {
        actingUserIsImpacting = true;
      }
    });

    const collaboratorData = {
      user: userData,
      impactingCount: impactedConnections.length,
      impactedUsers: impactedConnections,
    };

    // Sort collaborator
    if (!connection.CanCollaborate) {
      impactedCollaborators.push(collaboratorData);
    }
    if (actingUserIsImpacting) {
      impactingOthers.push(collaboratorData);
    }
    if (
      actingUserRequiredConnections &&
      actingUserRequiredConnections.has(connection.UserId) &&
      actingUserData
    ) {
      // Collaborator is in the acting user's required connections. Impacted fields are
      // fudged a little bit to add the current user, when ordinarily they would just show
      // users that are blocking the collaborator rather than the other way around
      impactingMe.push({
        user: userData,
        impactingCount: impactedConnections.length + 1,
        impactedUsers: [actingUserData, ...impactedConnections],
      });
    }
  });

  return { impactedCollaborators, impactingMe, impactingOthers };
};

// Given a universe, returns lists of users who are restricted from collaborating or are
// preventing others from collaborating, in addition to information about the current user's
// access requirements.
const useImpactedCollaborators = (universeId: number) => {
  const {
    data: universeCollaborationData,
    isLoading: isUniverseCollaborationLoading,
    error: universeCollaborationError,
  } = useGetUniverseCollaborationStatus(universeId);
  const { user } = useAuthentication();

  const parsedAdminData = useMemo(
    () => universeCollaborationData?.AdminView ?? [],
    [universeCollaborationData],
  );
  const parsedEditorData = useMemo(
    () => universeCollaborationData?.EditViewUsers ?? [],
    [universeCollaborationData],
  );

  // For constructing the Impacting Me data, we need the list of users IDs that the acting user
  // needs to be friends with
  const requiredConnectionsForUser = useMemo(() => {
    if (!universeCollaborationData?.EditView) {
      return undefined; // Skips Impacting Me bucketing
    }
    const requiresTrust = new Set<number>();
    universeCollaborationData.EditView.RequiresTrustedConnection.forEach((collaborator) => {
      requiresTrust.add(collaborator.UserId);
    });
    return requiresTrust;
  }, [universeCollaborationData]);

  // Construct map of user data (username, display name) to attach to displayed users
  const {
    data: userDataMap,
    isLoading: isUserDataLoading,
    error: userDataError,
  } = useUserDataMapping(user?.id, universeCollaborationData);

  return useMemo(() => {
    // Sort users into Impacted, Impacting me, and Impacting others, with user data
    const parsedImpactedCollaborators = parseImpactedCollaboratorListsFromResponse(
      universeCollaborationData?.IsAdmin ? parsedAdminData : parsedEditorData,
      userDataMap,
      user?.id ?? 0,
      requiredConnectionsForUser,
    );
    // TODO: populate friends and trusted friends info when that's exposed in the backend
    const accessedCollaborators =
      universeCollaborationData?.TenuredUsers.map((tenuredUser) =>
        userDataMap.get(tenuredUser),
      ).filter((tenuredUser) => tenuredUser !== undefined) ?? [];
    // Join attempts is returned mostly as-is, but with the user data populated
    const joinAttempts: JoinAttempt[] = [];
    universeCollaborationData?.BlockedUsers.forEach((blockedUser) => {
      const collaboratorData = userDataMap.get(blockedUser.UserId);
      if (collaboratorData) {
        joinAttempts.push({
          user: collaboratorData,
          timestamp: blockedUser.Timestamp,
        });
      }
    });

    // Matches the age-verification check from the legacy collaborators page.
    // For logging purposes.
    const isNotAgeVerified =
      universeCollaborationData?.EditView?.CanCollaborate === false &&
      universeCollaborationData?.EditView?.Error === 'NotAgeVerified';

    let error = null;
    if (
      universeCollaborationData?.Error &&
      universeCollaborationData.Error === 'TooManyCollaborators'
    ) {
      error = new Error(universeCollaborationData.Error);
    } else if (
      universeCollaborationData?.EditView?.Error &&
      universeCollaborationData.EditView.Error === 'AgeVerificationCountryBlocked'
    ) {
      error = new Error(universeCollaborationData.EditView.Error);
    } else {
      error = universeCollaborationError ?? userDataError;
    }

    return {
      canCollaborate:
        universeCollaborationData?.EditView?.CanCollaborate ?? universeCollaborationData?.IsAdmin,
      isAdmin: universeCollaborationData?.IsAdmin,
      isAgeVerified: !isNotAgeVerified,
      accessedCollaborators,
      impactedCollaborators: parsedImpactedCollaborators.impactedCollaborators,
      impactingMe: parsedImpactedCollaborators.impactingMe,
      impactingOthers: parsedImpactedCollaborators.impactingOthers,
      joinAttempts,
      error,
      isLoading: isUniverseCollaborationLoading || isUserDataLoading,
    };
  }, [
    universeCollaborationData,
    parsedAdminData,
    parsedEditorData,
    userDataMap,
    isUniverseCollaborationLoading,
    isUserDataLoading,
    universeCollaborationError,
    userDataError,
    user,
    requiredConnectionsForUser,
  ]);
};

export default useImpactedCollaborators;
