import { createContext } from 'react';
import type { Money, RevShareStatModel } from '@rbx/client-developer-subscriptions-api/v1';
import type { GetExperienceSubscriptionResponse } from '@modules/clients/experienceSubscriptions';

export interface ExperienceSubscriptionContext {
  experienceSubscriptionDetails?: GetExperienceSubscriptionResponse;
  usedSubscriptionNames: string[];
  isExperienceSubscriptionLoading: boolean;
  isExperienceSubscriptionRefreshRequired: boolean;
  priceTierMap:
    | {
        [key: string]: Money;
      }
    | undefined;
  revshareStatModelMap:
    | {
        [key: string]: RevShareStatModel;
      }
    | undefined;
  canAccessExperienceSubscription: boolean;
  refreshExperienceSubscriptionDetails: () => void;
}

const experienceSubscriptionsContext = createContext<ExperienceSubscriptionContext>({
  experienceSubscriptionDetails: undefined,
  usedSubscriptionNames: [],
  isExperienceSubscriptionLoading: false,
  isExperienceSubscriptionRefreshRequired: false,
  priceTierMap: undefined,
  revshareStatModelMap: undefined,
  canAccessExperienceSubscription: false,
  refreshExperienceSubscriptionDetails: () => ({}),
});
experienceSubscriptionsContext.displayName = 'experienceSubscriptions';

export default experienceSubscriptionsContext;
