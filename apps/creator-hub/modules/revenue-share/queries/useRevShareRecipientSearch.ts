// Searches eligible user and group revenue share recipients, excludes the managing group, and filters users by group membership.
import { useQuery } from '@tanstack/react-query';
import groupsClient from '@modules/clients/groups';
import { checkGroupMembership, searchUsers } from '@modules/group/utils/groupUtils';
import {
  RevShareRecipientType,
  type RevShareRecipientSearchResult,
} from '../interface/RevShareViewModel';

export const getRevShareRecipientSearchQueryKey = (managingGroupId: string, keyword: string) =>
  ['revenueShareAgreements', 'recipientSearch', managingGroupId, keyword] as const;

const parseGroupsClientNumericId = (id: string): number | undefined => {
  if (!/^[1-9]\d*$/.test(id)) {
    return undefined;
  }
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId)) {
    return undefined;
  }
  return numericId;
};

const searchGroups = async (keyword: string): Promise<{ id: string; name: string }[]> => {
  try {
    const response = await groupsClient.searchGroups(keyword);
    return (response.data ?? [])
      .filter((g) => g.id !== undefined && g.name !== undefined)
      .map((g) => ({ id: String(g.id), name: g.name ?? '' }));
  } catch {
    return [];
  }
};

/** Excludes the managing group because an agreement owner cannot also be its recipient. */
const searchRecipients = async (
  type: RevShareRecipientType,
  keyword: string,
  managingGroupId?: string,
): Promise<RevShareRecipientSearchResult[]> => {
  if (keyword.trim() === '') {
    return [];
  }

  if (type === RevShareRecipientType.Group) {
    const groups = await searchGroups(keyword);
    return groups
      .filter((g) => g.id !== managingGroupId)
      .map((g) => ({ id: g.id, name: g.name, type: RevShareRecipientType.Group }));
  }

  const users = await searchUsers(keyword);
  return users
    .filter((u) => u.id !== undefined && u.id !== null)
    .map((u) => ({
      id: String(u.id),
      name: u.displayName ?? u.name ?? String(u.id),
      subtitle: u.name ? `@${u.name}` : undefined,
      ...(u.name ? { username: u.name } : {}),
      type: RevShareRecipientType.User,
    }));
};

const searchAllRecipients = async (
  keyword: string,
  managingGroupId?: string,
): Promise<RevShareRecipientSearchResult[]> => {
  if (keyword.trim() === '') {
    return [];
  }
  const [users, groups] = await Promise.all([
    searchRecipients(RevShareRecipientType.User, keyword, managingGroupId),
    searchRecipients(RevShareRecipientType.Group, keyword, managingGroupId),
  ]);
  return [...users, ...groups];
};

/** Keeps group results unchanged and restricts user results to members of the managing group. */
const filterByGroupMembership = async (
  results: RevShareRecipientSearchResult[],
  managingGroupId: string,
): Promise<RevShareRecipientSearchResult[]> => {
  const groupId = parseGroupsClientNumericId(managingGroupId);

  if (groupId === undefined) {
    return results.filter((result) => result.type !== RevShareRecipientType.User);
  }

  const keepFlags = await Promise.all(
    results.map((result) => {
      if (result.type !== RevShareRecipientType.User) {
        return Promise.resolve(true);
      }
      const userId = parseGroupsClientNumericId(result.id);
      if (userId === undefined) {
        return Promise.resolve(false);
      }
      return checkGroupMembership(groupId, userId);
    }),
  );

  return results.filter((_result, index) => keepFlags[index]);
};

const fetchRevShareRecipientSearch = async (
  managingGroupId: string,
  keyword: string,
): Promise<RevShareRecipientSearchResult[]> => {
  if (keyword.trim() === '') {
    return [];
  }

  const results = await searchAllRecipients(keyword, managingGroupId);
  return filterByGroupMembership(results, managingGroupId);
};

export function useRevShareRecipientSearch({
  managingGroupId,
  keyword,
}: {
  managingGroupId: string;
  keyword: string;
}): {
  data: readonly RevShareRecipientSearchResult[];
  isLoading: boolean;
  error: Error | null;
} {
  const query = useQuery<RevShareRecipientSearchResult[]>({
    queryKey: getRevShareRecipientSearchQueryKey(managingGroupId, keyword),
    queryFn: () => fetchRevShareRecipientSearch(managingGroupId, keyword),
    enabled: managingGroupId !== '' && keyword.trim() !== '',
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
  };
}
