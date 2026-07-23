import { useQuery } from '@tanstack/react-query';
import type { OrganizationActivityFeedEvent } from '@modules/group/hooks/useOrganizationActivityFeedItemInfo';

const fetchOrgsServiceResponsesUpToDate = async (
  organizationId: string,
  cursor: string,
  date: number,
  currentOrgsServiceResponses: OrganizationActivityFeedEvent[] = [],
): Promise<OrganizationActivityFeedEvent[]> => {
  if (
    currentOrgsServiceResponses.length > 0 &&
    currentOrgsServiceResponses[currentOrgsServiceResponses.length - 1].createdUnixTimeMs < date
  ) {
    return currentOrgsServiceResponses;
  }

  // TODO: CRF-6850 migrate to grasshopper client
  const activityFeedServiceUrl = `${process.env.bedev2BaseUrl}/activity-feed-api/v1/orgs/history?organizationId=${organizationId}&cursor=${cursor}`;
  const response = await fetch(activityFeedServiceUrl, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Network response was not ok. Status: ${response.status}`);
  }

  const result = await response.json();
  const events = result.events as OrganizationActivityFeedEvent[];
  const newOrgsServiceResponses = currentOrgsServiceResponses.concat(events);
  const newOrgsServiceResponsesSorted = newOrgsServiceResponses.sort(
    (a, b) => b.createdUnixTimeMs - a.createdUnixTimeMs,
  );

  if (result.hasMore) {
    return fetchOrgsServiceResponsesUpToDate(
      organizationId,
      result.nextCursor,
      date,
      newOrgsServiceResponsesSorted,
    );
  }
  return newOrgsServiceResponsesSorted;
};

export default function useGetOrgsActivityFeed(organizationId: string, date: number) {
  return useQuery({
    queryKey: ['orgsActivityFeed', organizationId, date],
    queryFn: () => fetchOrgsServiceResponsesUpToDate(organizationId, '', date),
  });
}
