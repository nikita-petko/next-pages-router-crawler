import type { FunctionComponent } from 'react';
import React, { useState, useCallback, useMemo } from 'react';
import type { OrganizationActivityFeedEvent } from '@modules/group/hooks/useOrganizationActivityFeedItemInfo';
import ActivityFeedServiceContext from './ActivityFeedServiceContext';
import type { ActivityFeedServiceResponse, ActivityFeedEvent } from './useActivityFeedItemInfo';

// TODO: @jchong - ARKS-2006 - Migrate from this file to a proper grasshopper client.
const ActivityFeedServiceProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const [serviceResponses, setServiceResponses] = useState<ActivityFeedEvent[]>([]);
  const [orgServiceResponses, setOrgsServiceResponses] = useState<OrganizationActivityFeedEvent[]>(
    [],
  );
  const fetchServiceResponses = useCallback(async (universeId: number) => {
    try {
      const activityFeedServiceUrl = `${process.env.bedev2BaseUrl}/activity-feed-api/v1/history?clientType=1&universeId=${universeId}`;
      const response = await fetch(activityFeedServiceUrl, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok. Status: ${response.status}`);
      }

      const result = (await response.json()) as ActivityFeedServiceResponse;
      const sortedTransformedResult = result.events.sort(
        (a, b) => b.createdUnixTimeMs - a.createdUnixTimeMs,
      );
      setServiceResponses(sortedTransformedResult);
    } catch (error) {
      console.error('Error occurred during fetch or parsing:', error);
    }
  }, []);

  const fetchOrgsServiceResponses = useCallback(async (organizationId: string) => {
    try {
      const activityFeedServiceUrl = `${process.env.bedev2BaseUrl}/activity-feed-api/v1/orgs/history?organizationId=${organizationId}`;
      const response = await fetch(activityFeedServiceUrl, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok. Status: ${response.status}`);
      }

      const result = await response.json();
      const events = result.events as OrganizationActivityFeedEvent[];
      const sortedTransformedResult = events.sort(
        (a, b) => b.createdUnixTimeMs - a.createdUnixTimeMs,
      );
      setOrgsServiceResponses(sortedTransformedResult);
    } catch (error) {
      console.error('Error occurred during fetch or parsing:', error);
    }
  }, []);

  const memoizedValues = useMemo(
    () => ({
      serviceResponses,
      fetchServiceResponses,
      orgServiceResponses,
      fetchOrgsServiceResponses,
    }),
    [serviceResponses, fetchServiceResponses, orgServiceResponses, fetchOrgsServiceResponses],
  );

  return (
    <ActivityFeedServiceContext.Provider value={memoizedValues}>
      {children}
    </ActivityFeedServiceContext.Provider>
  );
};

export default ActivityFeedServiceProvider;
