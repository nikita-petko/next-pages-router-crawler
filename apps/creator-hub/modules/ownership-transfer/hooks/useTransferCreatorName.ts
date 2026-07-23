import { TransferCreator, TransferCreatorType } from '@modules/clients';
import useGetUserById from '@modules/react-query/users/userQueries';
import { useGetGroupInfo } from '@modules/react-query/groupMembers/groupMembersQueries';

const useTransferCreatorName = (creator: TransferCreator | undefined) => {
  const isUser = creator?.creatorType === TransferCreatorType.User;
  const isGroup = creator?.creatorType === TransferCreatorType.Group;

  const { data: user } = useGetUserById(isUser ? creator?.creatorId : undefined);

  const { data: groupInfo } = useGetGroupInfo(isGroup ? creator?.creatorId?.toString() : undefined);

  if (isGroup) {
    return { name: groupInfo?.groupName ?? '' };
  }

  return { name: user?.name ?? '' };
};

export default useTransferCreatorName;
