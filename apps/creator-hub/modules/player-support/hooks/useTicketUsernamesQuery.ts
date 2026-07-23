import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CreatorTicket } from '@modules/clients/creatorCommunication';
import usersClient from '@modules/clients/users';
import { DEFAULT_STALE_TIME_MS } from '../constants/timeConstants';
import { getPlayerSupportTicketUsernamesQueryKey } from '../queryKeys';

export type UsernameMap = Record<string, string>;

const EMPTY_USERNAME_MAP: UsernameMap = {};

function parseAuthorId(author?: string): number | null {
  if (!author) {
    return null;
  }
  const parsed = Number(author);
  return Number.isNaN(parsed) ? null : parsed;
}

function collectTicketUserIds(ticket: CreatorTicket | undefined): number[] {
  if (!ticket) {
    return [];
  }
  const ids = new Set<number>();
  if (ticket.summary?.userId != null) {
    ids.add(ticket.summary.userId);
  }
  ticket.comments?.forEach((comment) => {
    const parsed = parseAuthorId(comment.author);
    if (parsed != null) {
      ids.add(parsed);
    }
  });
  return Array.from(ids);
}

const useTicketUsernamesQuery = (
  ticket: CreatorTicket | undefined,
): { usernameMap: UsernameMap } => {
  const userIds = useMemo(() => collectTicketUserIds(ticket), [ticket]);

  const { data } = useQuery({
    queryKey: getPlayerSupportTicketUsernamesQueryKey(userIds),
    queryFn: async (): Promise<UsernameMap> => {
      const response = await usersClient.getUsersByIds(userIds);
      const map: UsernameMap = {};
      response.data?.forEach((user) => {
        if (user.id != null) {
          map[String(user.id)] = user.displayName ?? user.name ?? String(user.id);
        }
      });
      return map;
    },
    enabled: userIds.length > 0,
    staleTime: DEFAULT_STALE_TIME_MS,
  });

  return { usernameMap: data ?? EMPTY_USERNAME_MAP };
};

export default useTicketUsernamesQuery;
