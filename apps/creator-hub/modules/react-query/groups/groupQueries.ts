import { useQuery } from '@tanstack/react-query';
import { groupsClient, tryParseResponseError } from '@modules/clients';
import { StatusCodes } from '@rbx/core';
import type { GroupSocialLink } from '@modules/clients/groups';
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

export function useGetGroupDetails(groupId: number | undefined, enabled: boolean = true) {
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

export function useGetGroupSocialLinks(groupId: number | undefined, enabled: boolean = true) {
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
          groupSocialLinksAgeVerificationStatus: Number(
            response.socialLinksVerificationStatus ?? 0,
          ),
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
            groupSocialLinksAgeVerificationStatus: Number(SocialLinksVerificationStatus.None),
          };
        }
        throw error;
      }
    },
  });
}
