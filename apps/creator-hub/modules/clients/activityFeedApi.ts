import createFetchClient from '@rbx/client-activity-feed-api';
import { getBEDEV2ServiceBasePath } from './utils';

const activityFeedApiClient = createFetchClient({
  baseUrl: getBEDEV2ServiceBasePath('activity-feed-api'),
  credentials: 'include',
  enableMrRouter: true,
});

export default activityFeedApiClient;
