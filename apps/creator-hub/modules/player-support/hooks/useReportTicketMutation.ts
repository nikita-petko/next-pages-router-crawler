import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import creatorCommunicationApi, {
  type ReportCreatorTicketResponse,
} from '@modules/clients/creatorCommunication';
import { getPlayerSupportTicketDetailQueryKey } from '../queryKeys';
import useIdempotencyKey, { idempotentRetryConfig } from './useIdempotencyKey';

export interface UseReportTicketMutationParams {
  universeId: number;
  ticketId: string;
  onSuccess?: (response: ReportCreatorTicketResponse) => void;
  onError?: (error: unknown) => void;
}

const useReportTicketMutation = ({
  universeId,
  ticketId,
  onSuccess,
  onError,
}: UseReportTicketMutationParams): UseMutationResult<
  ReportCreatorTicketResponse,
  unknown,
  void
> => {
  const queryClient = useQueryClient();
  const idempotencyKey = useIdempotencyKey('report');

  return useMutation({
    ...idempotentRetryConfig,
    mutationFn: () =>
      creatorCommunicationApi.v1beta1CreatorCommunicationApiCreatorTicketsCreatorTicketIdReportPost(
        {
          creatorTicketId: ticketId,
          reportCreatorTicketRequest: {
            creatorTicketId: ticketId,
            universeId,
            idempotencyKey: idempotencyKey.ensure(),
          },
        },
      ),
    // Refresh both the ticket lists and this ticket's detail cache so the UI
    // reflects whatever the backend did with the reported ticket (e.g. moved
    // to the reported queue, status change, etc.).
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: ['playerSupportTickets'] });
      void queryClient.invalidateQueries({
        queryKey: getPlayerSupportTicketDetailQueryKey(ticketId),
      });
      onSuccess?.(response);
    },
    onError,
    onSettled: idempotencyKey.reset,
  });
};

export default useReportTicketMutation;
