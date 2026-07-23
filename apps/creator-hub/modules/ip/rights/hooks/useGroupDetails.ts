import { groupsClient } from '@modules/clients';
import { useQuery } from '@tanstack/react-query';

const groupDetailsKey = 'rightsClient/groupDetails';

export default function useGroupDetails(groupId: number) {
  return useQuery({
    queryKey: [groupDetailsKey, groupId],
    queryFn: () => groupsClient.getGroupInfo(groupId),
    enabled: groupId > 0,
  });
}
