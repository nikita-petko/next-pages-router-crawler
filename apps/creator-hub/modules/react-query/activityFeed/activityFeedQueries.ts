import { useQuery } from '@tanstack/react-query';
import activityFeedApiClient from '@modules/clients/activityFeedApi';
import type { OrganizationActivityFeedEvent } from '@modules/group/hooks/useOrganizationActivityFeedItemInfo';

interface OrgsHistoryResult {
  events: OrganizationActivityFeedEvent[];
  hasMore: boolean;
  nextCursor: string;
}

const fetchOrgsServiceResponsesUpToDate = async (
  organizationId: string,
  cursor: string,
  startDate: Date,
  endDate: Date,
  currentOrgsServiceResponses: OrganizationActivityFeedEvent[] = [],
): Promise<OrganizationActivityFeedEvent[]> => {
  if (
    currentOrgsServiceResponses.length > 0 &&
    currentOrgsServiceResponses[currentOrgsServiceResponses.length - 1].createdUnixTimeMs <
      startDate.getTime()
  ) {
    return currentOrgsServiceResponses;
  }

  const response = await activityFeedApiClient.GET('/v1/orgs/history', {
    params: {
      query: {
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- org IDs are int64 and cannot be safely converted to JS number; openapi-fetch serializes query params to strings at runtime
        organizationId: organizationId as unknown as number,
        cursor: cursor || undefined,
        startDate: endDate.toISOString(),
      },
    },
  });

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- response shape is null in swagger but returns an object; cast to our known response shape
  const result = response.data as unknown as OrgsHistoryResult;
  const newOrgsServiceResponses = currentOrgsServiceResponses.concat(result.events);
  const newOrgsServiceResponsesSorted = newOrgsServiceResponses.sort(
    (a, b) => b.createdUnixTimeMs - a.createdUnixTimeMs,
  );

  if (result.hasMore) {
    return fetchOrgsServiceResponsesUpToDate(
      organizationId,
      result.nextCursor,
      startDate,
      endDate,
      newOrgsServiceResponsesSorted,
    );
  }
  return newOrgsServiceResponsesSorted;
};

export default function useGetOrgsActivityFeed(
  organizationId: string,
  startDate: Date,
  endDate: Date,
) {
  return useQuery({
    queryKey: ['orgsActivityFeed', organizationId, startDate.getTime(), endDate.getTime()],
    queryFn: () => fetchOrgsServiceResponsesUpToDate(organizationId, '', startDate, endDate),
  });
}
