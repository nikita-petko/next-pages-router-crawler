import type { CookieBasedAuthClient } from '@clients/cookieBasedAuth';
import type { CookieBasedUsersClient } from '@clients/cookieBasedUsers';
import type { AuthenticationManager, UserType } from '@type/authentication';

export default class CookieBasedAuthenticationManager implements AuthenticationManager {
  constructor(
    private authClient: CookieBasedAuthClient,
    private usersClient: CookieBasedUsersClient,
  ) {}

  authenticate(): Promise<UserType> {
    return this.usersClient.getAuthenticatedUser();
  }

  logout(): Promise<void> {
    return this.authClient.logout();
  }
}
