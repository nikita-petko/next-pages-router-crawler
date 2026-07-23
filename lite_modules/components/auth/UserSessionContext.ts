import { createContext } from 'react';

import { UserSession } from '@type/authentication';

const UserSessionContext = createContext<UserSession>({
  authenticatedUser: null,
  isLoggedIn: false,
  isReady: false,
  isUserModerated: false,
  logout: () => {
    throw new Error('Not implemented');
  },
  tryAuthenticate: () => {
    throw new Error('Not implemented');
  },
});
UserSessionContext.displayName = 'UserSession';

export default UserSessionContext;
