/** Auto generated API client entry file for auth */
import { Configuration } from '@rbx/clients-core';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { AuthenticationApi } from '@rbx/client-auth/v1';
import { getBEDEV1ServiceBasePath } from './utils';

export class AuthClassClient {
  private authenticationAPI: AuthenticationApi;

  constructor(basePathAuth: string = getBEDEV1ServiceBasePath('auth')) {
    const defaultConfiguration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath: basePathAuth,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });

    this.authenticationAPI = new AuthenticationApi(defaultConfiguration);
  }

  async logout(): Promise<void> {
    await this.authenticationAPI.v1LogoutPost();
  }
}

const authClient = new AuthClassClient();

const basePath = getBEDEV1ServiceBasePath('auth');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});
const authenticationApi = new AuthenticationApi(configuration);

export const AuthClient = { authenticationApi };
export default authClient;
