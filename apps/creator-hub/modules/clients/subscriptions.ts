import {
  SubscriptionsV2Api,
  type SubscriptionsV2ListSubscriptionsRequest,
  type ListSubscriptionsResponse,
  type Subscription,
} from '@rbx/client-subscriptions-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type { ListSubscriptionsResponse, SubscriptionsV2ListSubscriptionsRequest, Subscription };
export { ProductType } from '@rbx/client-subscriptions-api/v1';

const configuration = createClientConfiguration('subscriptions', 'bedev2');

const subscriptionsV2Api = new SubscriptionsV2Api(configuration);

const subscriptionsClient = {
  listSubscriptions(
    request?: SubscriptionsV2ListSubscriptionsRequest,
  ): Promise<ListSubscriptionsResponse> {
    return subscriptionsV2Api.subscriptionsV2ListSubscriptions(request);
  },
};

export default subscriptionsClient;
