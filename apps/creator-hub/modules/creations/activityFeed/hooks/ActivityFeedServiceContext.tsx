import { createContext } from 'react';
import type { OrganizationActivityFeedEvent } from '@modules/group/hooks/useOrganizationActivityFeedItemInfo';
import type { ActivityFeedEvent } from './useActivityFeedItemInfo';

export interface ActivityFeedServiceContextValue {
  serviceResponses: ActivityFeedEvent[];
  fetchServiceResponses: (universeId: number) => Promise<void>;
  orgServiceResponses: OrganizationActivityFeedEvent[];
  fetchOrgsServiceResponses: (organizationId: string) => Promise<void>;
}

const throwNotImplementedError = () => {
  throw new Error(
    'Function not implemented. You may be trying to use this context outside of a provider.',
  );
};

const defaultServiceValue: ActivityFeedServiceContextValue = {
  serviceResponses: [],
  fetchServiceResponses: throwNotImplementedError,
  orgServiceResponses: [],
  fetchOrgsServiceResponses: throwNotImplementedError,
};

const ActivityFeedServiceContext =
  createContext<ActivityFeedServiceContextValue>(defaultServiceValue);
ActivityFeedServiceContext.displayName = 'ActivityFeedService';

export default ActivityFeedServiceContext;
