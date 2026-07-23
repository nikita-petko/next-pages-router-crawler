import type { SigninWithRedirectOptions, UserClaims } from '@okta/okta-auth-js';
import type OktaAuth from '@okta/okta-auth-js';
import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useState, useMemo, createContext, useContext } from 'react';
import type { TOktaAuthenticationContext, TOktaAuthenticationStatus } from './types';

const OktaAuthenticationContext = createContext<TOktaAuthenticationContext>({
  user: null,
  status: 'initial',
  isFetched: false,
  login: () => {
    throw new Error('useOktaAuthentication must be used within a OktaAuthenticationProvider');
  },
  logout: () => {
    throw new Error('useOktaAuthentication must be used within a OktaAuthenticationProvider');
  },
});

export const useOktaAuthentication = () => {
  return useContext(OktaAuthenticationContext);
};

export const MockedOktaAuthenticationProvider: FunctionComponent<
  React.PropsWithChildren<TOktaAuthenticationContext>
> = ({ children, ...args }) => {
  return (
    <OktaAuthenticationContext.Provider value={args}>{children}</OktaAuthenticationContext.Provider>
  );
};

export const OktaAuthenticationProvider: FunctionComponent<
  React.PropsWithChildren<{
    oktaClient: OktaAuth;
  }>
> = ({ oktaClient, children }) => {
  const [user, setUser] = useState<
    (UserClaims & { accessToken?: string; idToken?: string }) | null
  >(null);
  const [isFetched, setIsFetched] = useState<boolean>(false);
  const [status, setStatus] = useState<TOktaAuthenticationStatus>('initial');

  const login = useCallback(
    async (args: SigninWithRedirectOptions) => {
      await oktaClient.signInWithRedirect(args);
    },
    [oktaClient],
  );

  const logout = useCallback(async () => {
    await oktaClient.signOut();
    oktaClient.tokenManager.setTokens({});
    setUser(null);
  }, [oktaClient]);

  useEffect(() => {
    const authenticate = async () => {
      /**
       * Since we aren't using react-router, we have to do more work in handling the auth redirect.
       *
       * This if statement is executed if we are coming back from a login.
       * It saves the OIDC tokens for usage in the app. See
       * https://github.com/okta/okta-auth-js#strategies-for-obtaining-tokens
       */
      setStatus('loading');
      if (oktaClient.token.isLoginRedirect()) {
        const { tokens } = await oktaClient.token.parseFromUrl();
        oktaClient.tokenManager.setTokens(tokens);
      }
      try {
        const isAuthenticated = await oktaClient.isAuthenticated();
        if (isAuthenticated) {
          const userData = await oktaClient.getUser();
          setUser({
            ...userData,
            accessToken: oktaClient.getAccessToken() ?? '',
            idToken: oktaClient.getIdToken() ?? '',
          });
          setStatus('success');
        } else {
          setStatus('unauthenticated');
        }
      } catch {
        setStatus('error');
      }
      setIsFetched(true);
    };
    authenticate();
    // NOTE(jcountryman,11/28/23): Authentication should always only happen once
    // on mount. The passed arguments in the provider should not be mutable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const oktaAuthenticationContextValue = useMemo<TOktaAuthenticationContext>(
    () => ({
      user,
      isFetched,
      status,
      login,
      logout,
    }),
    [user, isFetched, status, login, logout],
  );

  return (
    <OktaAuthenticationContext.Provider value={oktaAuthenticationContextValue}>
      {children}
    </OktaAuthenticationContext.Provider>
  );
};
