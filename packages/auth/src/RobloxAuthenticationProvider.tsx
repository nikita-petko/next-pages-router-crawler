import type { FunctionComponent, PropsWithChildren } from 'react';
import React, { useCallback, useEffect, useState, useMemo, createContext, useContext } from 'react';
import type { DiscoveryApi } from '@rbx/client-application-authorizations-api/v1';
import type { AuthenticationApi } from '@rbx/client-auth/v1';
import type { UsersApi } from '@rbx/client-users/v1';
import type { ResponseError } from '@rbx/clients-core';
import type { AuthStoreApi } from './AuthStore';
import { useAuthStore } from './AuthStore';
import type { TAuthenticationStatus, TLoginArgs, TRobloxAuthenticationContext } from './types';
import getCurrentUrl from './utils/getCurrentUrl';
import tryParseBEDEV1Error from './utils/parseBedev1Error';

const NotAuthenticatedErrorCode = 9002;
const UserModeratedMessage = 'User is moderated';

const RobloxAuthenticationContext = createContext<TRobloxAuthenticationContext>({
  user: null,
  status: 'initial',
  isFetched: false,
  login: () => {
    throw new Error('useRobloxAuthentication must be used within a RobloxAuthenticationProvider');
  },
  logout: () => {
    throw new Error('useRobloxAuthentication must be used within a RobloxAuthenticationProvider');
  },
});

export const useRobloxAuthentication = () => {
  return useContext(RobloxAuthenticationContext);
};
export const MockedRobloxAuthenticationProvider: FunctionComponent<
  PropsWithChildren<TRobloxAuthenticationContext>
> = ({ children, ...args }) => {
  return (
    <RobloxAuthenticationContext.Provider value={args}>
      {children}
    </RobloxAuthenticationContext.Provider>
  );
};

export const RobloxAuthenticationProvider: FunctionComponent<{
  clientId: string;
  authenticationClient: AuthenticationApi;
  discoveryClient: DiscoveryApi;
  usersClient: UsersApi;
  store: AuthStoreApi;
  children?: React.ReactNode;
}> = ({ clientId, authenticationClient, discoveryClient, usersClient, store, children }) => {
  const [isFetched, setIsFetched] = useState<boolean>(false);
  const [status, setStatus] = useState<TAuthenticationStatus>('initial');

  const login = useCallback(
    async ({ redirectUri, ...args }: TLoginArgs = {}) => {
      // NOTE (xchi, 11/29/23): When we use <Component onClick={login} />
      // An SyntheticBaseEvent object is in this function as the default parameter
      // and we don't want 'redirectUri' to be an object
      const parsedRedirectUri = typeof redirectUri === 'string' ? redirectUri : getCurrentUrl();
      const { authorizationEndpoint } = await discoveryClient.discoveryGetDiscoveryConfiguration();
      const authUrl = new URL(authorizationEndpoint);
      const searchParams = new URLSearchParams({
        client_id: clientId,
        redirect_uri: parsedRedirectUri,
        scope: 'openid',
        response_type: 'none',
        prompt: 'none',
        ...args,
      });
      authUrl.search = searchParams.toString();
      window.location.assign(authUrl.href);
    },
    [clientId, discoveryClient],
  );

  const { user, setUser } = useAuthStore(store);

  const logout = useCallback(async () => {
    await authenticationClient.v1LogoutPost();
    if (user !== null) {
      setUser(null);
      setStatus('logged-out');
    }
  }, [authenticationClient, user, setUser]);

  useEffect(() => {
    const authenticate = async () => {
      try {
        setStatus('loading');
        const { id, name, displayName } = await usersClient.v1UsersAuthenticatedGet();
        if (id !== undefined && name !== undefined) {
          const fetchedUser = { id, name, displayName };
          setUser(fetchedUser);
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (e) {
        // eslint-disable-next-line typescript/no-unsafe-type-assertion
        const response: Response | undefined = (e as ResponseError).response;
        const parsedError = response ? await tryParseBEDEV1Error(response) : null;
        if (parsedError?.message === UserModeratedMessage) {
          setStatus('moderated');
        } else if (parsedError?.code === NotAuthenticatedErrorCode || response?.status === 401) {
          setStatus('unauthenticated');
        } else {
          setStatus('error');
        }
      } finally {
        setIsFetched(true);
      }
    };

    void authenticate();
    // NOTE(jcountryman,11/28/23): Authentication should always only happen once
    // on mount. The passed arguments in the provider should not be mutable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const robloxAuthenticationContextValue = useMemo<TRobloxAuthenticationContext>(
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
    <RobloxAuthenticationContext.Provider value={robloxAuthenticationContextValue}>
      {children}
    </RobloxAuthenticationContext.Provider>
  );
};
