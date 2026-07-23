// TODO: Replace with generated client once Inbox API is available in @rbx/clients/talentHubV2Service
import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';
import type { ApiInboxResponse } from '../types';

const BASE_PATH = getBEDEV2ServiceBasePath('talent-hub-v2-service');

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

export const inboxClient = {
  getInbox: async (): Promise<ApiInboxResponse> => {
    const response = await fetch(`${BASE_PATH}/api/Inbox`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },
};

export default inboxClient;
