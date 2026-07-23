import { getGroupUrl, getUserUrl } from '@modules/miscellaneous/common/urls/www';
import useUserDetails from './useUserDetails';
import useGroupDetails from './useGroupDetails';

export default function useCreatorInfo(creatorType: string, creatorId: string) {
  const numericId = parseInt(creatorId, 10) || 0;
  const isUser = creatorType.toLowerCase() === 'user';
  const isGroup = creatorType.toLowerCase() === 'group';

  const userQuery = useUserDetails(isUser ? numericId : 0);
  const groupQuery = useGroupDetails(isGroup ? numericId : 0);

  if (isUser) {
    return {
      name: userQuery.data?.name ?? '',
      url: getUserUrl(numericId),
      isPending: userQuery.isPending,
    };
  }
  if (isGroup) {
    return {
      name: groupQuery.data?.name ?? '',
      url: getGroupUrl(numericId),
      isPending: groupQuery.isPending,
    };
  }
  return { name: '', url: '', isPending: false };
}
