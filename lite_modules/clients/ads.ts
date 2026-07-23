import { AxiosResponse } from 'axios';

import { executeApiCall } from '@clients/axiosInterceptors';
import BaseClient, { DeleteOptions, GetOptions, PatchOptions, PostOptions } from '@clients/base';
import {
  getAdsManagementApiBaseUrl,
  getAdsManagementApiRequestHeaders,
  shouldAdsManagementApiSendCredentials,
} from '@utils/adsManagementApiDevOverride';

class AdsClient extends BaseClient {
  protected baseURL = getAdsManagementApiBaseUrl();

  // eslint-disable-next-line class-methods-use-this
  getBaseURL() {
    return getAdsManagementApiBaseUrl();
  }

  // eslint-disable-next-line class-methods-use-this
  protected getSendCredentials(): boolean {
    return shouldAdsManagementApiSendCredentials();
  }

  buildHeaders(headers: Record<string, string>) {
    return super.buildHeaders({
      ...getAdsManagementApiRequestHeaders(),
      ...headers,
    });
  }

  async get<T>(options: GetOptions): Promise<AxiosResponse<T>> {
    this.baseURL = this.getBaseURL();
    return executeApiCall(() => super.get<T>(options));
  }

  async post<T>(options: PostOptions): Promise<AxiosResponse<T>> {
    this.baseURL = this.getBaseURL();
    return executeApiCall(() => super.post<T>(options));
  }

  async patch<T>(options: PatchOptions): Promise<AxiosResponse<T>> {
    this.baseURL = this.getBaseURL();
    return executeApiCall(() => super.patch<T>(options));
  }

  async delete<T>(options: DeleteOptions): Promise<AxiosResponse<T>> {
    this.baseURL = this.getBaseURL();
    return executeApiCall(() => super.delete<T>(options));
  }
}

const adsClient = new AdsClient();

export default adsClient;
