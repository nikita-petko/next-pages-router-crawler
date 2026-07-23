import { AuthenticationApi } from '@rbx/client-auth/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export class AuthClassClient {
  private authenticationAPI: AuthenticationApi;

  constructor() {
    this.authenticationAPI = new AuthenticationApi(createClientConfiguration('auth', 'bedev1'));
  }

  async logout(): Promise<void> {
    await this.authenticationAPI.v1LogoutPost();
  }
}

const authClient = new AuthClassClient();

const authenticationApi = new AuthenticationApi(createClientConfiguration('auth', 'bedev1'));

export const AuthClient = { authenticationApi };
export default authClient;
