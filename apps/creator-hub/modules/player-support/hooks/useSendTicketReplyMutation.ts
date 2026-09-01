import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import creatorCommunicationApi, {
  type TicketResponse,
  type UpdateTicketAsCreatorResponse,
} from '@modules/clients/creatorCommunication';
import useIdempotencyKey, { idempotentRetryConfig } from './useIdempotencyKey';

export interface UseSendTicketReplyMutationParams {
  ticketId: string;
  universeId?: number;
  onSuccess?: (response: UpdateTicketAsCreatorResponse) => void;
  onError?: (error: unknown) => void;
}

const useSendTicketReplyMutation = ({
  ticketId,
  universeId,
  onSuccess,
  onError,
}: UseSendTicketReplyMutationParams): UseMutationResult<
  UpdateTicketAsCreatorResponse,
  unknown,
  TicketResponse
> => {
  const idempotencyKey = useIdempotencyKey('ticket-reply');

  return useMutation({
    ...idempotentRetryConfig,
    mutationFn: (response: TicketResponse) =>
      creatorCommunicationApi.v1beta1CreatorCommunicationApiCreatorTicketsCreatorTicketIdPatch({
        creatorTicketId: ticketId,
        updateTicketAsCreatorRequest: {
          creatorTicketId: ticketId,
          universeId,
          response,
          idempotencyKey: idempotencyKey.ensure(),
        },
      }),
    onSuccess,
    onError,
    onSettled: idempotencyKey.reset,
  });
};

export default useSendTicketReplyMutation;
