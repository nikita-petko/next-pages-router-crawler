import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
} from '@tanstack/react-query';
import creatorCommunicationApi, {
  type ListCreatorTicketSummariesByStatusAndUniverseResponse,
  type UpdateViewedByCreatorResponse,
} from '@modules/clients/creatorCommunication';

interface MarkAsViewedContext {
  previous: Array<[QueryKey, ListCreatorTicketSummariesByStatusAndUniverseResponse | undefined]>;
}

const useMarkTicketViewedMutation = (): UseMutationResult<
  UpdateViewedByCreatorResponse,
  Error,
  string,
  MarkAsViewedContext
> => {
  const queryClient = useQueryClient();

  return useMutation<UpdateViewedByCreatorResponse, Error, string, MarkAsViewedContext>({
    mutationFn: (tid: string) =>
      creatorCommunicationApi.v1beta1CreatorCommunicationApiCreatorTicketsCreatorTicketIdViewedPatch(
        {
          creatorTicketId: tid,
          updateViewedByCreatorRequest: { creatorTicketId: tid },
        },
      ),
    // Optimistically clear the unread dot in any cached ticket list so the
    // creator sees it already read when they navigate back. We snapshot the
    // previous list-page caches so we can restore them verbatim if the PATCH
    // fails, which avoids a refetch racing with any in-flight pagination.
    onMutate: (tid: string) => {
      const previous =
        queryClient.getQueriesData<ListCreatorTicketSummariesByStatusAndUniverseResponse>({
          queryKey: ['playerSupportTickets'],
        });
      queryClient.setQueriesData<ListCreatorTicketSummariesByStatusAndUniverseResponse>(
        { queryKey: ['playerSupportTickets'] },
        (old) => {
          if (!old?.creatorTicketSummaries) {
            return old;
          }
          return {
            ...old,
            creatorTicketSummaries: old.creatorTicketSummaries.map((t) =>
              t.creatorTicketId === tid ? { ...t, viewedByCreator: true } : t,
            ),
          };
        },
      );
      return { previous };
    },
    onError: (_error, _tid, context) => {
      context?.previous.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
    },
  });
};

export default useMarkTicketViewedMutation;
