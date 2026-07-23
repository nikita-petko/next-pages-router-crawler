import createFetchClient from '@rbx/client-analytics-custom-dashboards-api';
import { getBEDEV2ServiceBasePath } from '../utils';

/**
 * Generated openapi-fetch client for analytics-custom-dashboards.
 * Prefer this over raw fetch; CSRF / MrRouter are handled by clients-core.
 */
const customDashboardsApiClient = createFetchClient({
  baseUrl: getBEDEV2ServiceBasePath('analytics-custom-dashboards'),
  credentials: 'include',
  enableMrRouter: true,
});

export default customDashboardsApiClient;
