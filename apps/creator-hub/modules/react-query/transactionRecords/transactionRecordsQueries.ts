import { useMemo } from 'react';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import groupsClient from '@modules/clients/groups';
import type {
  LedgerReason,
  TransactionEntity,
  TransactionRecord,
  TransactionRecordsResponse,
} from '@modules/clients/transactionRecords';
import { TransactionEntityType } from '@modules/clients/transactionRecords';
import usersClient from '@modules/clients/users';
import type { PublishSalesReportDownloadParams } from './transactionRecordsRequests';
import {
  getGroupTransactions,
  getUserTransactions,
  publishSalesReportDownload,
} from './transactionRecordsRequests';

export type UseFetchTransactionsArgs = {
  // Exactly one of userId / groupId identifies the virtual. groupId takes precedence.
  userId?: number;
  groupId?: number;
  limit: number;
  cursor?: string;
  ledgerReason?: LedgerReason;
  startTimeMillis?: number;
  endTimeMillis?: number;
  enabled?: boolean;
};

/**
 * Fetches a page of v2 transaction records for a user or group virtual using
 * cursor-based pagination.
 */
export function useFetchTransactions({
  userId,
  groupId,
  limit,
  cursor,
  ledgerReason,
  startTimeMillis,
  endTimeMillis,
  enabled = true,
}: UseFetchTransactionsArgs): UseQueryResult<TransactionRecordsResponse> {
  // Resolve the single target up front (groupId wins) so the query key reflects only what is
  // actually fetched; keying on an ignored id would cache identical requests separately.
  const target =
    groupId != null
      ? ({ kind: 'group', id: groupId } as const)
      : userId != null
        ? ({ kind: 'user', id: userId } as const)
        : null;

  return useQuery({
    queryKey: [
      'transactionRecords',
      target?.kind ?? null,
      target?.id ?? null,
      limit,
      cursor ?? null,
      ledgerReason ?? null,
      startTimeMillis ?? null,
      endTimeMillis ?? null,
    ],
    queryFn: async () => {
      if (target?.kind === 'group') {
        return getGroupTransactions({
          groupId: target.id,
          limit,
          cursor,
          ledgerReason,
          startTimeMillis,
          endTimeMillis,
        });
      }
      if (target?.kind === 'user') {
        return getUserTransactions({
          userId: target.id,
          limit,
          cursor,
          ledgerReason,
          startTimeMillis,
          endTimeMillis,
        });
      }
      throw new Error('useFetchTransactions requires either userId or groupId');
    },
    enabled: enabled && target != null,
    // Keep the current page visible while a page-size or cursor change refetches, so the table
    // refreshes in place instead of collapsing to the loading state (which scrolls to the top).
    placeholderData: keepPreviousData,
  });
}

const COUNTER_PARTY_KEY_PREFIX = 'transactionRecordsCounterParty';

const firstNonBlank = (...values: (string | undefined | null)[]): string | undefined =>
  values.find((value): value is string => value != null && value !== '');

// Parses an entity id into a canonical positive safe integer. Rejects partial ("123abc"),
// non-numeric, non-positive, and unsafe values so malformed ids are skipped, not silently fetched.
export const toCanonicalId = (id?: string | null): number | null => {
  if (id == null || !/^\d+$/.test(id)) {
    return null;
  }
  const parsed = Number(id);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

export type ResolveCounterPartyName = (entity?: TransactionEntity | null) => string | undefined;

/**
 * Resolves the display names for the counterparties on a page of transactions with a single
 * batched user request and a single batched group request, instead of one lookup per row. Returns
 * a resolver that maps a counterParty entity to its name (undefined until loaded / unavailable).
 */
export function useCounterPartyNames(records: TransactionRecord[]): ResolveCounterPartyName {
  const { userIds, groupIds } = useMemo(() => {
    const users = new Set<number>();
    const groups = new Set<number>();
    records.forEach((record) => {
      const entity = record.counterParty;
      const id = toCanonicalId(entity?.id);
      if (id == null) {
        return;
      }
      // Only User/Group counterparties resolve to a name; unknown or missing types are skipped
      // rather than defaulting to the users endpoint.
      if (entity?.type === TransactionEntityType.Group) {
        groups.add(id);
      } else if (entity?.type === TransactionEntityType.User) {
        users.add(id);
      }
    });
    // Sorted so the query key is stable regardless of row order.
    return {
      userIds: [...users].sort((a, b) => a - b),
      groupIds: [...groups].sort((a, b) => a - b),
    };
  }, [records]);

  const { data: usersData } = useQuery({
    enabled: userIds.length > 0,
    queryKey: [COUNTER_PARTY_KEY_PREFIX, 'users', userIds],
    queryFn: () => usersClient.getUsersByIds(userIds),
  });

  const { data: groupsData } = useQuery({
    enabled: groupIds.length > 0,
    queryKey: [COUNTER_PARTY_KEY_PREFIX, 'groups', groupIds],
    queryFn: () => groupsClient.getGroupsInfo(groupIds),
  });

  return useMemo<ResolveCounterPartyName>(() => {
    const names = new Map<string, string>();
    usersData?.data?.forEach((user) => {
      const name = firstNonBlank(user.displayName, user.name);
      if (user.id != null && name) {
        names.set(`${TransactionEntityType.User}:${user.id}`, name);
      }
    });
    groupsData?.data?.forEach((group) => {
      if (group.id != null && group.name) {
        names.set(`${TransactionEntityType.Group}:${group.id}`, group.name);
      }
    });
    return (entity) => {
      if (!entity?.id) {
        return undefined;
      }
      return names.get(`${entity.type}:${entity.id}`);
    };
  }, [usersData, groupsData]);
}

/**
 * Queues an async virtual sales report download for a virtual + date range.
 */
export function usePublishSalesReportDownload(): UseMutationResult<
  void,
  Error,
  PublishSalesReportDownloadParams
> {
  return useMutation({
    mutationFn: (params: PublishSalesReportDownloadParams) => publishSalesReportDownload(params),
  });
}
