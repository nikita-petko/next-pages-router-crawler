import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { GetLookDetailResponseV2, LookDetailV2 } from '@rbx/client-look-api/v1';
import Look from '@modules/miscellaneous/common/enums/Look';
import lookClient from './look';

export type { LookDetailV2 };

export type TUseAvatarLooksInfiniteQueryArgs = {
  curatorUserId: string;
  pageSize: number;
  enabled: boolean;
};

export function useAvatarLooksInfiniteQuery({
  curatorUserId,
  pageSize,
  enabled,
}: TUseAvatarLooksInfiniteQueryArgs) {
  return useInfiniteQuery({
    queryKey: ['avatar-looks-by-curator', curatorUserId, pageSize],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      return lookClient.getLooksByCuratorAndType(curatorUserId, Look.Avatar, pageSize, pageParam);
    },
    getNextPageParam: (lastPage) => {
      const c = lastPage.nextCursor;
      return c ?? undefined;
    },
    enabled,
  });
}

export function useLinkedAvatarIdsQuery({
  universeId,
  enabled,
}: {
  universeId: number;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: ['linked-avatar-ids', universeId],
    queryFn: async () => {
      const { lookIds } = await lookClient.getLinkedAvatarsByUniverse(String(universeId));
      return lookIds ?? [];
    },
    enabled,
  });
}

export function useLinkedAvatarDetails(lookIds: string[]) {
  return useQueries({
    queries: lookIds.map((id) => ({
      queryKey: ['look-detail', id],
      queryFn: () => lookClient.getLookDetail(id),
      select: (data: GetLookDetailResponseV2) => data.look ?? null,
    })),
  });
}

export function useLinkAvatarsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ universeId, lookIds }: { universeId: string; lookIds: string[] }) =>
      lookClient.linkAvatarsToUniverse(universeId, lookIds),
    onSuccess: (_, { universeId }) => {
      void queryClient.invalidateQueries({ queryKey: ['linked-avatar-ids', Number(universeId)] });
    },
  });
}

export function useUnlinkAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ universeId, lookId }: { universeId: string; lookId: string }) =>
      lookClient.unlinkAvatarsFromUniverse(universeId, [lookId]),
    onSuccess: (_, { universeId }) => {
      void queryClient.invalidateQueries({ queryKey: ['linked-avatar-ids', Number(universeId)] });
    },
  });
}
