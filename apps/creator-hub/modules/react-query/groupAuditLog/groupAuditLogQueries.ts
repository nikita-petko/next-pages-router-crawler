import { useQuery } from '@tanstack/react-query';
import type { GroupAuditLogResponseItem, GroupAuditLogActionTypes } from '@modules/clients/groups';
import groupsClient, {
  GroupAuditLimitEnum,
  GroupAuditLogActionTypeEnum,
} from '@modules/clients/groups';

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
  startDate: Date,
  endDate: Date,
  currentAuditLogResponses: GroupAuditLogResponseItem[],
  actionType: GroupAuditLogActionTypes,
): Promise<GroupAuditLogResponseItem[]> => {
  if (
    currentAuditLogResponses.length > 0 &&
    Number(currentAuditLogResponses[currentAuditLogResponses.length - 1].created ?? 0) <
      startDate.getTime()
  ) {
    return currentAuditLogResponses.filter(
      (item) => Number(item.created ?? 0) <= endDate.getTime(),
    );
  }

  const auditLogResponse = await groupsClient.getGroupAuditLog(
    groupId,
    actionType,
    undefined,
    GroupAuditLimitEnum.NUMBER_100,
    cursor,
  );
  const events = auditLogResponse.data ?? [];
  const newAuditLogResponses = currentAuditLogResponses.concat(events);
  const sortedAuditLogResponses = newAuditLogResponses.sort(
    (a, b) => Number(b.created ?? 0) - Number(a.created ?? 0),
  );

  if (auditLogResponse.nextPageCursor) {
    return fetchAuditLogResponsesUpToDate(
      groupId,
      auditLogResponse.nextPageCursor,
      startDate,
      endDate,
      sortedAuditLogResponses,
      actionType,
    );
  }
  return sortedAuditLogResponses.filter((item) => Number(item.created ?? 0) <= endDate.getTime());
};

const fetchAllAuditLogResponses = async (
  groupId: number,
  startDate: Date,
  endDate: Date,
): Promise<GroupAuditLogResponseItem[]> => {
  const auditLogResponsesArrays = await Promise.all(
    GroupAuditLogFetchActionTypes.map((actionType) =>
      fetchAuditLogResponsesUpToDate(groupId, '', startDate, endDate, [], actionType),
    ),
  );
  const allAuditLogResponses = auditLogResponsesArrays.flat();

  return allAuditLogResponses.sort((a, b) => Number(b.created ?? 0) - Number(a.created ?? 0));
};

export default function useGetGroupAuditLog(groupId: string, startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['groupAuditLog', groupId, startDate.getTime(), endDate.getTime()],
    queryFn: () => fetchAllAuditLogResponses(Number(groupId), startDate, endDate),
  });
}
