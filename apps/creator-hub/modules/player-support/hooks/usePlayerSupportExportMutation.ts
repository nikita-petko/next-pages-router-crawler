import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import creatorCommunicationApi, {
  type ExportCreatorTicketsRequest,
  type ExportCreatorTicketsResponse,
} from '@modules/clients/creatorCommunication';

export interface PlayerSupportExportMutationParams extends ExportCreatorTicketsRequest {
  universeId: number;
}

const usePlayerSupportExportMutation = (): UseMutationResult<
  ExportCreatorTicketsResponse,
  unknown,
  PlayerSupportExportMutationParams
> =>
  useMutation({
    mutationFn: ({ universeId, ...request }) =>
      creatorCommunicationApi.v1beta1CreatorCommunicationApiUniversesUniverseIdCreatorTicketsExportPost(
        {
          universeId,
          exportCreatorTicketsRequest: {
            ...request,
            universeId,
          },
        },
      ),
  });

export default usePlayerSupportExportMutation;
