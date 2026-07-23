import { useQuery } from '@tanstack/react-query';
import groupsClient from '@modules/clients/groups';

const groupDetailsKey = 'rightsClient/groupDetails';

export default function useGroupDetails(groupId: number) {
  return useQuery({
    queryKey: [groupDetailsKey, groupId],
    queryFn: () => groupsClient.getGroupInfo(groupId),
    enabled: groupId > 0,
  });
}
