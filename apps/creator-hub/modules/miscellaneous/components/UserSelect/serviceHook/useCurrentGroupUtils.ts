import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthentication } from '@modules/authentication/providers';
import groupsClient from '@modules/clients/groups';
import organizationApiClient from '@modules/clients/organizationApi';
import type { User } from '@modules/clients/users';
import usersClient from '@modules/clients/users';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import useGetUsersFriends from '@modules/react-query/friends/friendsQuery';
import { useGetInvitationsByOrganizationId } from '@modules/react-query/groupMembers/invitationsQueries';
import { useGetInvitationsByRole } from '@modules/react-query/groupMembers/rolesQueries';
import { useGetUsersByOrganizationId } from '@modules/react-query/groupMembers/usersQueries';
import useFriendsBatchRequester from './useFriendsBatchRequester';

const MAX_FETCH_SIZE = 100;

type TUseCurrentGroupUtilsProps = {
  roleId?: string;
  overrideFetchAllInvitedUsersAndMembers?: boolean;
};

const useCurrentGroupUtils = ({
  roleId,
  overrideFetchAllInvitedUsersAndMembers,
}: TUseCurrentGroupUtilsProps = {}) => {
  const cacheState = useRef<{
    invitations: boolean;
    membership: boolean;
    friendship: boolean;
    inviteRoles: boolean;
  }>({
    invitations: false,
    membership: false,
    friendship: false,
    inviteRoles: false,
  });

  const [allInvitedUsersAndMembers, setAllInvitedUsersAndMembers] = useState<User[] | undefined>();

  const orgMembersCache = useRef<Map<string, boolean>>(new Map());
  const orgRoleCache = useRef<Map<string, boolean>>(new Map());
  const orgInvitationsCache = useRef<Map<string, string | undefined>>(new Map());
  const orgFriendshipCache = useRef<Map<string, boolean>>(new Map());

  const { user } = useAuthentication();
  const { organization } = useCurrentOrganization();
  const checkFriendship = useFriendsBatchRequester();

  const groupId = organization?.groupId ? parseInt(organization.groupId, 10) : undefined;
  const organizationId = organization?.id;
  const authenticatedUserId = user?.id;

  const { data: invitations, isFetching: isInvitationsFetching } =
    useGetInvitationsByOrganizationId(organization?.id, undefined, MAX_FETCH_SIZE);
  const { data: orgUsers, isFetching: isUsersFetching } = useGetUsersByOrganizationId(
    organization?.id,
    undefined,
    MAX_FETCH_SIZE,
  );
  const { data: invitationsByRole, isFetching: isUsersWithRoleFetching } = useGetInvitationsByRole(
    organization?.id,
    roleId,
    undefined,
    MAX_FETCH_SIZE,
  );
  const { data: friends, isFetching: isFriendsFetching } = useGetUsersFriends(authenticatedUserId);

  const isFetching =
    !groupId ||
    !organizationId ||
    !authenticatedUserId ||
    isInvitationsFetching ||
    isUsersFetching ||
    isUsersWithRoleFetching ||
    isFriendsFetching;

  const fetchAllInvitedUsersAndMembers = useCallback(async () => {
    const allUserIds = Array.from(orgMembersCache.current.keys())
      .concat(Array.from(orgInvitationsCache.current.keys()))
      .map((id) => parseInt(id, 10));
    try {
      const allUsers = await usersClient.getUsersByIds(allUserIds);
      setAllInvitedUsersAndMembers(allUsers.data);
    } catch {
      // in case of failure, we fallback to the uncached flow
      setAllInvitedUsersAndMembers(undefined);
    }
  }, []);

  const isUserInGroup = useCallback(
    async (userId: number): Promise<boolean> => {
      if (cacheState.current.membership) {
        return orgMembersCache.current.get(userId.toString()) ?? false;
      }

      try {
        const rolesResponse = await groupsClient.getUsersGroupRoles(userId);
        const group = rolesResponse.data?.filter((role) => role.group?.id === groupId);
        const isInGroup = group?.length !== 0;
        return isInGroup;
      } catch {
        return false;
      }
    },
    [groupId],
  );

  const getUserInvitationId = useCallback(
    async (userId: number): Promise<string | undefined> => {
      if (cacheState.current.invitations) {
        return orgInvitationsCache.current.get(userId.toString());
      }

      try {
        const userInvitation =
          await organizationApiClient.userClient.getUserInvitationByOrganization(
            organizationId!,
            `${userId}`,
          );
        return userInvitation.id;
      } catch {
        return undefined;
      }
    },
    [organizationId],
  );

  const isUserInvited = useCallback(
    async (userId: number): Promise<boolean> => !!(await getUserInvitationId(userId)),
    [getUserInvitationId],
  );

  const isUserFriend = useCallback(
    async (userId: number): Promise<boolean> => {
      if (cacheState.current.friendship) {
        return orgFriendshipCache.current.get(userId.toString()) ?? false;
      }

      try {
        const isFriend = await checkFriendship(userId);
        return isFriend;
      } catch {
        return false;
      }
    },
    [checkFriendship],
  );

  const isUserInRole = useCallback(
    async (userId: number): Promise<boolean> => {
      if (!roleId) {
        throw new Error('Role ID is required for this function');
      }

      if (orgRoleCache.current.has(userId.toString())) {
        return orgRoleCache.current.get(userId.toString()) ?? false;
      }

      if (cacheState.current.membership && orgMembersCache.current.has(userId.toString())) {
        return orgRoleCache.current.get(userId.toString()) ?? false;
      }

      if (cacheState.current.inviteRoles && orgInvitationsCache.current.has(userId.toString())) {
        return orgRoleCache.current.get(userId.toString()) ?? false;
      }

      try {
        const invitationId = await getUserInvitationId(userId);
        if (invitationId) {
          const { roleIds } = await organizationApiClient.invitationClient.getRoleIdsByInvitationId(
            organizationId!,
            invitationId,
          );
          const roleIdsSet = new Set(roleIds);
          return roleIdsSet.has(roleId);
        }
      } catch {}

      if (cacheState.current.membership) {
        // all members are fetched and we already fetched invitation roles, so we do not have to query any more.
        return false;
      }

      try {
        const { roles } = await organizationApiClient.userClient.getUserRoles(
          organizationId!,
          `${userId}`,
        );
        const roleIdsSet = new Set(roles.map((role) => role.id));
        return roleIdsSet.has(roleId);
      } catch {}
      return false;
    },
    [roleId, organizationId, getUserInvitationId],
  );

  useEffect(() => {
    if (isFetching) {
      return;
    }

    cacheState.current = {
      invitations: !!invitations && invitations.invitations.length < MAX_FETCH_SIZE,
      membership: !!orgUsers && orgUsers.users.length < MAX_FETCH_SIZE,
      friendship: !!friends && friends.length < 200, // useGetUsersFriends returns max 200 friends
      inviteRoles: !!invitationsByRole && invitationsByRole.invitations.length < MAX_FETCH_SIZE,
    };

    // set cache values
    orgMembersCache.current = new Map(
      orgUsers?.users.map((orgUser) => [orgUser.userId!, true]) ?? [],
    );

    orgInvitationsCache.current = new Map(
      invitations?.invitations.map((invitation) => [invitation.recipientUserId!, invitation.id]) ??
        [],
    );

    orgRoleCache.current = new Map(
      orgUsers?.users.map((roleUser) => [
        roleUser.userId!,
        roleUser.roles?.some((role) => role.id === roleId) ?? false,
      ]) ?? [],
    );
    invitationsByRole?.invitations.forEach((invitation) => {
      orgRoleCache.current.set(invitation.recipientUserId!.toString(), true);
    });

    orgFriendshipCache.current = new Map(
      friends?.map((friend) => [friend.id!.toString(), true]) ?? [],
    );

    const hasNecessaryDataToFetchInvitedUsersAndMembers =
      cacheState.current.membership && cacheState.current.invitations;
    const shouldFetch =
      (overrideFetchAllInvitedUsersAndMembers ?? false)
        ? overrideFetchAllInvitedUsersAndMembers
        : !!roleId;

    // prefetch all invited users and members if we have the necessary data
    if (hasNecessaryDataToFetchInvitedUsersAndMembers && shouldFetch) {
      fetchAllInvitedUsersAndMembers();
    }
  }, [
    isFetching,
    fetchAllInvitedUsersAndMembers,
    friends,
    invitations,
    invitationsByRole,
    orgUsers,
    roleId,
    overrideFetchAllInvitedUsersAndMembers,
  ]);

  const returnValue = useMemo(
    () => ({
      isUserInGroup,
      isUserInvited,
      isUserFriend,
      isUserInRole,
      allInvitedUsersAndMembers,
      isFetching,
    }),
    [
      isUserInGroup,
      isUserInvited,
      isUserFriend,
      isUserInRole,
      allInvitedUsersAndMembers,
      isFetching,
    ],
  );

  return returnValue;
};
export default useCurrentGroupUtils;
