import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';
import type {
  ApiApplication,
  ApiCreateApplicationRequest,
  ApiListApplicationsParams,
  ApiListApplicationsResponse,
} from '../types';
import { fetchWithCsrf, handleResponse } from './apiUtils';

const BASE_PATH = getBEDEV2ServiceBasePath('talent-hub-v2-service');

export const applicationsClient = {
  listApplications: async (
    params: ApiListApplicationsParams = {},
  ): Promise<ApiListApplicationsResponse> => {
    const qs = new URLSearchParams();
    if (params.jobId) {
      qs.set('jobId', params.jobId);
    }
    if (params.pageSize) {
      qs.set('pageSize', String(params.pageSize));
    }
    if (params.pageToken) {
      qs.set('pageToken', params.pageToken);
    }
    if (params.status) {
      params.status.forEach((s) => qs.append('status', String(s)));
    }
    if (params.favorite !== undefined) {
      qs.set('favorite', String(params.favorite));
    }
    if (params.viewed !== undefined) {
      qs.set('viewed', String(params.viewed));
    }

    const query = qs.toString();
    const url = `${BASE_PATH}/api/Applications${query ? `?${query}` : ''}`;
    const response = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },

  getApplication: async (id: string): Promise<ApiApplication> => {
    const response = await fetch(`${BASE_PATH}/api/Applications/${id}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },

  createApplication: async (payload: ApiCreateApplicationRequest): Promise<ApiApplication> => {
    const response = await fetchWithCsrf(`${BASE_PATH}/api/Applications`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  favoriteApplication: async (id: string): Promise<void> => {
    const response = await fetchWithCsrf(`${BASE_PATH}/api/Applications/${id}/favorite`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      await handleResponse(response);
    }
  },

  unfavoriteApplication: async (id: string): Promise<void> => {
    const response = await fetchWithCsrf(`${BASE_PATH}/api/Applications/${id}/unfavorite`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      await handleResponse(response);
    }
  },

  withdrawApplication: async (id: string): Promise<void> => {
    const response = await fetchWithCsrf(`${BASE_PATH}/api/Applications/${id}/withdraw`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      await handleResponse(response);
    }
  },
};

export default applicationsClient;
