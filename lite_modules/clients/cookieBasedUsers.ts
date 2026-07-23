import {
  DisplayNamesApi,
  RobloxUsersApiAuthenticatedGetUserResponse,
  UsersApi,
  V1DisplayNamesValidateGetRequest,
} from '@rbx/client-users/v1';
import { Configuration } from '@rbx/clients-core';

import { GetBEDEV1ServiceBasePath } from '@utils/url';

export class CookieBasedUsersClient {
  private displayNameApi: DisplayNamesApi;

  private usersApi: UsersApi;

  constructor(basePath: string = GetBEDEV1ServiceBasePath('users')) {
    const configuration = new Configuration({
      basePath,
      credentials: 'include',
    });
    this.displayNameApi = new DisplayNamesApi(configuration);
    this.usersApi = new UsersApi(configuration);
  }

  getAuthenticatedUser(): Promise<RobloxUsersApiAuthenticatedGetUserResponse> {
    return this.usersApi.v1UsersAuthenticatedGet();
  }

  async validateDisplayName(request: V1DisplayNamesValidateGetRequest): Promise<void> {
    await this.displayNameApi.v1DisplayNamesValidateGet(request);
  }
}
const cookieBasedUsersClient = new CookieBasedUsersClient();

export default cookieBasedUsersClient;
