import { BaseAPI, Configuration, JSONApiResponse, VoidApiResponse } from '@rbx/clients-core';

/**
 * Generic requester for the moderation packages' HTTP adapters.
 */
class AuthenticatedHttpClient extends BaseAPI {
  get<T>(url: string): Promise<T> {
    return this.request({
      headers: {},
      method: 'GET',
      path: url,
      schemaPath: url,
    }).then((response) => new JSONApiResponse<T>(response).value());
  }

  post<T>(url: string, body?: object): Promise<T> {
    return this.request({
      body,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      method: 'POST',
      path: url,
      schemaPath: url,
    }).then((response) => new JSONApiResponse<T>(response).value());
  }

  postWithoutResponse(url: string, body?: object): Promise<void> {
    return this.request({
      body,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      method: 'POST',
      path: url,
      schemaPath: url,
    }).then((response) => new VoidApiResponse(response).value());
  }
}

const httpClient = new AuthenticatedHttpClient(
  new Configuration({
    basePath: '',
    credentials: 'include',
    robloxSiteDomain: process.env.robloxSiteDomain,
  }),
);

export const authenticatedHttpGet = <T>(url: string): Promise<T> => httpClient.get<T>(url);

export const authenticatedHttpPost = <T>(url: string, body?: object): Promise<T> =>
  httpClient.post<T>(url, body);

export const authenticatedHttpPostWithoutResponse = (url: string, body?: object): Promise<void> =>
  httpClient.postWithoutResponse(url, body);
