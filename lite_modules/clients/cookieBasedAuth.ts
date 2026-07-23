/** Auto generated API client entry file for auth */
import { AuthenticationApi, AuthenticationTicketApi } from '@rbx/client-auth/v1';
import { Configuration } from '@rbx/clients-core';

import { GetBEDEV1ServiceBasePath } from '@utils/url';

type AuthenticationTicketResponse = {
  ticket: string | null;
};

export class CookieBasedAuthClient {
  private authenticationAPI: AuthenticationApi;

  private authenticationTicketAPI: AuthenticationTicketApi;

  constructor(basePathAuth: string = GetBEDEV1ServiceBasePath('auth')) {
    const defaultConfiguration = new Configuration({
      basePath: basePathAuth,
      credentials: 'include',
    });
    this.authenticationAPI = new AuthenticationApi(defaultConfiguration);
    this.authenticationTicketAPI = new AuthenticationTicketApi(defaultConfiguration);
  }

  async getAuthenticationTicket(): Promise<AuthenticationTicketResponse> {
    // @ts-ignore
    const response = await this.authenticationTicketAPI.v1AuthenticationTicketPostRaw();
    return {
      ticket: response.raw.headers.get('rbx-authentication-ticket'),
    };
  }

  async logout(): Promise<void> {
    await this.authenticationAPI.v1LogoutPost();
  }
}

const cookieBasedAuthClient = new CookieBasedAuthClient();

export default cookieBasedAuthClient;
