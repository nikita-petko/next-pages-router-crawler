import { ReactNode, useCallback, useEffect, useState } from 'react';

import UserSessionContext from '@components/auth/UserSessionContext';
import type { AuthenticationManager, UserType } from '@type/authentication';

interface AuthenticationProviderProps {
  children: ReactNode;
  manager: AuthenticationManager;
}

const AuthenticationProvider = ({ children, manager }: AuthenticationProviderProps) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const logout = useCallback(async () => {
    await manager.logout();
    setUser(null);
  }, [manager]);

  const tryAuthenticate = useCallback(async () => {
    let authSuccess = false;
    try {
      const currentUser = await manager.authenticate();
      setUser(currentUser);
      authSuccess = true;
    } catch {
      setUser(null);
      authSuccess = false;
    } finally {
      setIsInitialized(true);
    }
    return authSuccess;
  }, [manager]);

  useEffect(() => {
    tryAuthenticate();
  }, [tryAuthenticate]);

  return (
    <UserSessionContext.Provider
      value={{
        authenticatedUser: user,
        isLoggedIn: typeof user !== 'undefined' && user !== null,
        isReady: isInitialized,
        isUserModerated: false,
        logout,
        tryAuthenticate,
      }}>
      {children}
    </UserSessionContext.Provider>
  );
};

export default AuthenticationProvider;
