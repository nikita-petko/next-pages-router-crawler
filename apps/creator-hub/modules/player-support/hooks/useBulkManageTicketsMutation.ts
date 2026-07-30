import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import creatorCommunicationApi, {
  BulkManageCreatorTicketResultStatus,
  BulkManageCreatorTicketsAction,
  CreatorTicketReadFilter,
  type BulkManageCreatorTicketResult,
  type BulkManageCreatorTicketsResponse,
  type CreatorTicketSummary,
  type SearchCreatorTicketsResponse,
  type TicketResponse,
} from '@modules/clients/creatorCommunication';
import useIdempotencyKey, { idempotentRetryConfig } from './useIdempotencyKey';

export interface BulkManageTicketsVariables {
  universeId: number;
  creatorTicketIds: readonly string[];
  action: BulkManageCreatorTicketsAction;
  response?: TicketResponse;
}

const PLAYER_SUPPORT_QUERY_STATUS_INDEX = 2;
const PLAYER_SUPPORT_QUERY_READ_FILTER_INDEX = 4;

const isTicketVisibleAfterBulkReply = (
  ticket: CreatorTicketSummary,
  queryKey: readonly unknown[],
): boolean => {
  const status = queryKey[PLAYER_SUPPORT_QUERY_STATUS_INDEX];
  return !ticket.status || !status || ticket.status === status;
};

const isTicketVisibleAfterReadUpdate = (
  ticket: CreatorTicketSummary,
  queryKey: readonly unknown[],
): boolean => {
  const readFilter = queryKey[PLAYER_SUPPORT_QUERY_READ_FILTER_INDEX];
  if (readFilter === CreatorTicketReadFilter.Read) {
    return ticket.viewedByCreator === true;
  }
  if (readFilter === CreatorTicketReadFilter.Unread) {
    return ticket.viewedByCreator !== true;
  }
  return true;
};

const updateTicketFromBulkResult = (
  ticket: CreatorTicketSummary,
  result: BulkManageCreatorTicketResult,
  action: BulkManageCreatorTicketsAction,
): CreatorTicketSummary => {
  const viewedByCreator =
    result.viewedByCreator ??
    (action === BulkManageCreatorTicketsAction.MarkAsRead
      ? true
      : action === BulkManageCreatorTicketsAction.MarkAsUnread
        ? false
        : undefined);

  return {
    ...ticket,
    ...(result.ticketStatus ? { status: result.ticketStatus } : {}),
    ...(result.userTicketStatus ? { userTicketStatus: result.userTicketStatus } : {}),
    ...(viewedByCreator === undefined ? {} : { viewedByCreator }),
  };
};

const useBulkManageTicketsMutation = (): UseMutationResult<
  BulkManageCreatorTicketsResponse,
  unknown,
  BulkManageTicketsVariables
> => {
  const queryClient = useQueryClient();
  const idempotencyKey = useIdempotencyKey('bulk-manage-tickets');

  return useMutation({
    ...idempotentRetryConfig,
    mutationFn: ({ universeId, creatorTicketIds, action, response }) =>
      creatorCommunicationApi.v1beta1CreatorCommunicationApiUniversesUniverseIdCreatorTicketsBulkManagePost(
        {
          universeId,
          bulkManageCreatorTicketsRequest: {
            universeId,
            creatorTicketIds: [...creatorTicketIds],
            action,
            response,
            idempotencyKey: idempotencyKey.ensure(),
          },
        },
      ),
    onSuccess: ({ results }, { action }) => {
      const successfulResults = new Map(
        (results ?? [])
          .filter(
            (result) =>
              result.resultStatus === BulkManageCreatorTicketResultStatus.Succeeded &&
              result.creatorTicketId,
          )
          .map((result) => [result.creatorTicketId, result]),
      );

      queryClient
        .getQueriesData<SearchCreatorTicketsResponse>({
          queryKey: ['playerSupportTickets'],
        })
        .forEach(([queryKey, cached]) => {
          if (!cached?.creatorTicketSummaries || successfulResults.size === 0) {
            return;
          }

          queryClient.setQueryData<SearchCreatorTicketsResponse>(queryKey, {
            ...cached,
            creatorTicketSummaries: cached.creatorTicketSummaries.flatMap((ticket) => {
              const result = ticket.creatorTicketId
                ? successfulResults.get(ticket.creatorTicketId)
                : undefined;
              if (!result) {
                return [ticket];
              }

              const updatedTicket = updateTicketFromBulkResult(ticket, result, action);
              if (action === BulkManageCreatorTicketsAction.BulkReply) {
                return isTicketVisibleAfterBulkReply(updatedTicket, queryKey)
                  ? [updatedTicket]
                  : [];
              }
              return isTicketVisibleAfterReadUpdate(updatedTicket, queryKey) ? [updatedTicket] : [];
            }),
          });
        });

      // The search index can lag behind the bulk-management response. An immediate
      // refetch would overwrite the confirmed local results with stale list data.
      // Mark caches stale without refetching so they refresh on the next visit.
      void queryClient.invalidateQueries({
        queryKey: ['playerSupportTickets'],
        refetchType: 'none',
      });
    },
    onSettled: idempotencyKey.reset,
  });
};

export default useBulkManageTicketsMutation;
