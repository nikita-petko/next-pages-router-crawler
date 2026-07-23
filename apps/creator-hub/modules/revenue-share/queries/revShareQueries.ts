// Provides revenue share React Query hooks for manager agreements, party identity resolution, proposals, and cancellations.
import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import groupsClient from '@modules/clients/groups';
import usersClient from '@modules/clients/users';
import CreatorType from '@modules/miscellaneous/common/enums/Creator';
import type {
  ResolvedRevShareParty,
  RevShareAcceptOrDecline,
  RevShareProposeResult,
  RevShareRecipient,
  RevShareRecipientAllocation,
  RevShareTarget,
} from '../interface/RevShareViewModel';
import { RevShareRecipientType } from '../interface/RevShareViewModel';
import { asNumberTypedId } from '../utils/revShareUtils';
import {
  cancelRevShareProposal,
  getRevShareForManager,
  getRevShareForRecipient,
  proposeRevShareAllocateUnallocated,
  proposeRevShareChange,
  respondToRevShareProposal,
} from './revShareApi';

export type {
  ResolvedRevShareParty,
  RevShareProposeResult,
  RevShareRecipientAllocation,
  RevShareTarget,
};

const EMPTY_GROUP_IDS: string[] = [];

const getStableIds = (ids: string[]): string[] => [...new Set(ids)].sort();

const managerKey = (managingGroupId: string) =>
  ['revenueShareAgreements', 'manager', managingGroupId] as const;

const recipientKey = (
  recipientType: RevShareRecipient['type'] | undefined,
  recipientId: string | undefined,
) => ['revenueShareAgreements', 'recipient', recipientType ?? '', recipientId ?? ''] as const;

const getRevShareUserNamesQueryKey = (userIds: string[]) =>
  ['revenueShareAgreements', 'partyNames', 'users', userIds] as const;

const getRevShareGroupNamesQueryKey = (groupIds: string[]) =>
  ['revenueShareAgreements', 'partyNames', 'groups', groupIds] as const;

export function useRevShareForManager(managingGroupId?: string) {
  return useQuery({
    queryKey: managerKey(managingGroupId ?? ''),
    queryFn: () => {
      if (!managingGroupId) {
        throw new Error('managingGroupId required');
      }
      return getRevShareForManager(managingGroupId);
    },
    enabled: Boolean(managingGroupId),
  });
}

export function useRevShareForRecipient(recipientRef?: RevShareRecipient) {
  const recipientType = recipientRef?.type;
  const recipientId = recipientRef?.id;
  return useQuery({
    queryKey: recipientKey(recipientType, recipientId),
    queryFn: () => {
      if (recipientRef === undefined) {
        throw new Error('recipientRef required');
      }
      return getRevShareForRecipient(recipientRef);
    },
    enabled: recipientRef !== undefined,
  });
}

export function useRevShareRecipientNames(
  recipients: RevShareRecipient[],
  extraGroupIds: string[] = EMPTY_GROUP_IDS,
) {
  const userIds = useMemo(
    () =>
      getStableIds(
        recipients
          .filter((recipient) => recipient.type === RevShareRecipientType.User)
          .map((recipient) => recipient.id),
      ),
    [recipients],
  );
  const groupIds = useMemo(
    () =>
      getStableIds([
        ...recipients
          .filter((recipient) => recipient.type === RevShareRecipientType.Group)
          .map((recipient) => recipient.id),
        ...extraGroupIds,
      ]),
    [extraGroupIds, recipients],
  );

  const usersQuery = useQuery({
    queryKey: getRevShareUserNamesQueryKey(userIds),
    queryFn: () => usersClient.getUsersByIds(userIds.map(asNumberTypedId)),
    enabled: userIds.length > 0,
  });
  const groupsQuery = useQuery({
    queryKey: getRevShareGroupNamesQueryKey(groupIds),
    queryFn: () => groupsClient.getGroupsInfo(groupIds.map(asNumberTypedId)),
    enabled: groupIds.length > 0,
  });

  const userPartyById = useMemo(() => {
    const parties = new Map<string, ResolvedRevShareParty>();
    for (const user of usersQuery.data?.data ?? []) {
      if (user.id != null) {
        const id = String(user.id);
        const displayName = user.displayName ?? user.name ?? id;
        parties.set(id, {
          target: {
            id: asNumberTypedId(id),
            displayName,
            name: user.name ?? id,
          },
          targetType: CreatorType.User,
          name: displayName,
        });
      }
    }
    return parties;
  }, [usersQuery.data]);
  const groupPartyById = useMemo(() => {
    const parties = new Map<string, ResolvedRevShareParty>();
    for (const group of groupsQuery.data?.data ?? []) {
      if (group.id != null) {
        const id = String(group.id);
        const name = group.name ?? id;
        parties.set(id, {
          target: { id: asNumberTypedId(id), name },
          targetType: CreatorType.Group,
          name,
        });
      }
    }
    return parties;
  }, [groupsQuery.data]);

  const resolveRecipientParty = useCallback(
    (recipient: RevShareRecipient, fallbackName = recipient.id): ResolvedRevShareParty => {
      const resolvedParty =
        recipient.type === RevShareRecipientType.User
          ? userPartyById.get(recipient.id)
          : groupPartyById.get(recipient.id);
      if (resolvedParty) {
        return resolvedParty;
      }
      if (recipient.type === RevShareRecipientType.User) {
        return {
          target: {
            id: asNumberTypedId(recipient.id),
            displayName: fallbackName,
            name: recipient.id,
          },
          targetType: CreatorType.User,
          name: fallbackName,
        };
      }
      return {
        target: { id: asNumberTypedId(recipient.id), name: fallbackName },
        targetType: CreatorType.Group,
        name: fallbackName,
      };
    },
    [groupPartyById, userPartyById],
  );
  const resolveGroupParty = useCallback(
    (groupId: string, fallbackName = groupId): ResolvedRevShareParty =>
      groupPartyById.get(groupId) ?? {
        target: { id: asNumberTypedId(groupId), name: fallbackName },
        targetType: CreatorType.Group,
        name: fallbackName,
      },
    [groupPartyById],
  );
  const refetchUsers = usersQuery.refetch;
  const refetchGroups = groupsQuery.refetch;
  const refetch = useCallback(async (): Promise<void> => {
    await Promise.all([refetchUsers(), refetchGroups()]);
  }, [refetchGroups, refetchUsers]);

  return {
    resolveRecipientParty,
    resolveGroupParty,
    isLoading: usersQuery.isLoading || groupsQuery.isLoading,
    error: usersQuery.error ?? groupsQuery.error,
    refetch,
  };
}

export const targetKey = (target: RevShareTarget) => `${target.type}:${target.id}`;

export type ProposeRevShareArgs = {
  target: RevShareTarget;
  activeRevShareId: string | null;
  allocations: RevShareRecipientAllocation[];
  allocateUnallocated?: boolean;
};

export function useRevShareProposalMutations(
  managingGroupId?: string,
  onCancelSuccess?: () => void,
) {
  const queryClient = useQueryClient();
  const invalidate = useCallback(async () => {
    if (managingGroupId !== undefined) {
      await queryClient.invalidateQueries({ queryKey: managerKey(managingGroupId) });
    }
  }, [managingGroupId, queryClient]);

  const propose = useMutation<RevShareProposeResult, Error, ProposeRevShareArgs>({
    mutationFn: ({ target: proposedTarget, activeRevShareId, allocations, allocateUnallocated }) =>
      allocateUnallocated
        ? proposeRevShareAllocateUnallocated(proposedTarget, activeRevShareId, allocations)
        : proposeRevShareChange(proposedTarget, activeRevShareId, allocations),
    onSuccess: invalidate,
  });
  const cancel = useMutation<void, Error, string>({
    mutationFn: cancelRevShareProposal,
    onSuccess: async () => {
      // Close URL-backed cancellation state before manager invalidation can publish snapshots.
      onCancelSuccess?.();
      await invalidate();
    },
  });

  return { propose, cancel };
}

export type RespondToRevShareProposalArgs = {
  proposedRevShareId: string;
  response: RevShareAcceptOrDecline;
};

export function useRevShareRespondMutation(recipientRef?: RevShareRecipient) {
  const queryClient = useQueryClient();
  const recipientType = recipientRef?.type;
  const recipientId = recipientRef?.id;
  const invalidateRecipient = useCallback(
    () => queryClient.invalidateQueries({ queryKey: recipientKey(recipientType, recipientId) }),
    [queryClient, recipientId, recipientType],
  );

  return useMutation<void, Error, RespondToRevShareProposalArgs>({
    mutationFn: ({ proposedRevShareId, response }) => {
      if (recipientRef === undefined) {
        throw new Error('recipientRef required');
      }
      return respondToRevShareProposal({ proposedRevShareId, recipientRef, response });
    },
    // Refresh on failures too: stale/already-accepted proposals should reconcile to server state.
    onSettled: invalidateRecipient,
  });
}
