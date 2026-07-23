import { useQuery } from '@tanstack/react-query';
import { getUniverseCollaborationStatus } from '@modules/clients/teamCreateCollaboration';

const useGetUniverseCollaborationStatus = (universeId: number) => {
  return useQuery({
    queryKey: ['getUniverseCollaborationStatus', universeId],
    queryFn: () => getUniverseCollaborationStatus(universeId),
    enabled: !!universeId,
  });
};

export default useGetUniverseCollaborationStatus;
