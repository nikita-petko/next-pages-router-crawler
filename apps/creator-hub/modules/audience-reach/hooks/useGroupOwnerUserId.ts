import { useGetGroupInfo } from '@modules/react-query/groupMembers';

// Wraps a more generic useQuery hook and returns the owner ID, since that's all we care about
export const useGroupOwnerUserId = (groupId: number | undefined) => {
  const { data, isFetched, error } = useGetGroupInfo(groupId ? groupId.toString() : undefined);
  return {
    groupOwnerUserId: data?.ownerId,
    isGroupOwnerUserIdFetched: isFetched,
    groupOwnerUserIdError: error,
  };
};
