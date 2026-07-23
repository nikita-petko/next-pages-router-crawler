import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ListGroupResponse } from '@rbx/client-creator-home-api/v1';
import type { V1GroupsCreatePostRequest } from '@rbx/client-groups/v1';
import { StatusCodes } from '@rbx/core';
import { getGroupsQueryKey } from '@rbx/creator-hub-navigation';
import groupsClient from '@modules/clients/groups';
import type { GroupSocialLink } from '@modules/clients/groups';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import { SocialLinksVerificationStatus } from '@modules/social-links/constants';

const GROUPS_KEY_PREFIX = 'groups_';

const SOCIAL_LINKS_U13_FORBIDDEN_CODE = 13;

export type GroupDetailsResult = {
  description: string;
  owner?: {
    userId?: number;
    username?: string;
    displayName?: string;
  };
};

export type GroupSocialLinksResult = {
  data: GroupSocialLink[];
  isAddDisabled: boolean;
  groupSocialLinksAgeVerificationStatus: number;
};

export function useGetGroupDetails(groupId: number | undefined, enabled = true) {
  return useQuery({
    enabled: enabled && !!groupId,
    queryKey: [`${GROUPS_KEY_PREFIX}details`, groupId],
    queryFn: async (): Promise<GroupDetailsResult> => {
      if (!groupId) {
        throw new Error('Group ID is required');
      }
      const response = await groupsClient.getGroupInfo(groupId);
      return {
        description: response.description ?? '',
        owner: response.owner
          ? {
              userId: response.owner.userId,
              username: response.owner.username,
              displayName: response.owner.displayName,
            }
          : undefined,
      };
    },
  });
}

export function useGetGroupSocialLinks(groupId: number | undefined, enabled = true) {
  return useQuery({
    enabled: enabled && !!groupId,
    queryKey: [`${GROUPS_KEY_PREFIX}socialLinks`, groupId],
    queryFn: async (): Promise<GroupSocialLinksResult> => {
      if (!groupId) {
        throw new Error('Group ID is required');
      }
      try {
        const response = await groupsClient.getGroupSocialLinks(groupId);
        return {
          data: response.data ?? [],
          groupSocialLinksAgeVerificationStatus: response.socialLinksVerificationStatus ?? 0,
          isAddDisabled: false,
        };
      } catch (error) {
        const parsedError = await tryParseResponseError(error);
        if (
          parsedError?.status === StatusCodes.FORBIDDEN &&
          parsedError?.code === SOCIAL_LINKS_U13_FORBIDDEN_CODE
        ) {
          return {
            data: [],
            isAddDisabled: true,
            groupSocialLinksAgeVerificationStatus: SocialLinksVerificationStatus.None,
          };
        }
        throw error;
      }
    },
  });
}

export function useGetGroupMigrationStatus(groupId: number | undefined) {
  return useQuery({
    enabled: !!groupId,
    queryKey: [`${GROUPS_KEY_PREFIX}migrationStatus`, groupId],
    queryFn: async () => {
      if (!groupId) {
        throw new Error('Group ID is required');
      }
      return groupsClient.getGroupMigrationStatus(groupId);
    },
  });
}

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [`${GROUPS_KEY_PREFIX}Create`],
    mutationFn: async (createGroupRequest: V1GroupsCreatePostRequest) => {
      const response = await groupsClient.createGroup(createGroupRequest);

      if (response.id && response.name && response.created) {
        const group = {
          id: response.id,
          name: response.name,
          roleSetName: 'Owner',
          createdAt: response.created,
        };

        queryClient.setQueryData<ListGroupResponse>(getGroupsQueryKey, (data) => {
          if (data?.groups) {
            return {
              groups: [...data.groups, group],
            };
          }
          return data;
        });
      }

      return response;
    },
  });
};
