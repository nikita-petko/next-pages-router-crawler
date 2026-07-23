import { useQuery } from '@tanstack/react-query';
import {
  groupsClient,
  GroupAuditLimitEnum,
  GroupAuditLogResponseItem,
  GroupAuditLogActionTypes,
  GroupAuditLogActionTypeEnum,
} from '@modules/clients';

const GroupAuditLogFetchActionTypes = [
  GroupAuditLogActionTypeEnum.SpendGroupFunds,
  GroupAuditLogActionTypeEnum.Rename,
  GroupAuditLogActionTypeEnum.CreateGroupAsset,
  GroupAuditLogActionTypeEnum.ChangeOwner,
  GroupAuditLogActionTypeEnum.BuyAd,
  GroupAuditLogActionTypeEnum.JoinGroup,
  GroupAuditLogActionTypeEnum.LeaveGroup,
  GroupAuditLogActionTypeEnum.RemoveMember,
  GroupAuditLogActionTypeEnum.UpdateGroupIcon,
];

const fetchAuditLogResponsesUpToDate = async (
  groupId: number,
  cursor: string,
  date: Date,
  currentAuditLogResponses: GroupAuditLogResponseItem[],
  actionType: GroupAuditLogActionTypes,
): Promise<GroupAuditLogResponseItem[]> => {
  if (
    currentAuditLogResponses.length > 0 &&
    (currentAuditLogResponses[currentAuditLogResponses.length - 1].created ?? 0) < date
  ) {
    return currentAuditLogResponses;
  }

  const auditLogResponse = await groupsClient.getGroupAuditLog(
    groupId,
    actionType,
    undefined,
    GroupAuditLimitEnum.NUMBER_100,
    cursor,
  );
  const events = auditLogResponse.data as GroupAuditLogResponseItem[];
  const newAuditLogResponses = currentAuditLogResponses.concat(events);
  const sortedAuditLogResponses = newAuditLogResponses.sort(
    (a, b) => Number(b.created ?? 0) - Number(a.created ?? 0),
  );

  if (auditLogResponse.nextPageCursor) {
    return fetchAuditLogResponsesUpToDate(
      groupId,
      auditLogResponse.nextPageCursor,
      date,
      sortedAuditLogResponses,
      actionType,
    );
  }
  return sortedAuditLogResponses;
};

const fetchAllAuditLogResponses = async (
  groupId: number,
  date: number,
): Promise<GroupAuditLogResponseItem[]> => {
  const auditLogResponsesArrays = await Promise.all(
    GroupAuditLogFetchActionTypes.map((actionType) =>
      fetchAuditLogResponsesUpToDate(groupId, '', new Date(date), [], actionType),
    ),
  );
  const allAuditLogResponses = auditLogResponsesArrays.flat();

  return allAuditLogResponses.sort((a, b) => Number(b.created ?? 0) - Number(a.created ?? 0));
};

export default function useGetGroupAuditLog(groupId: string, date: number) {
  return useQuery({
    queryKey: ['groupAuditLog', groupId, date],
    queryFn: () => fetchAllAuditLogResponses(Number(groupId), date),
  });
}
