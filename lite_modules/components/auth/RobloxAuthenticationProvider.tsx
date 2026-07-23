import {
  RobloxAuthenticationProvider as BaseAuthenticationProvider,
  initializeAuthStore,
} from '@rbx/auth';
import { DiscoveryApi } from '@rbx/client-application-authorizations-api/v1';
import { AuthenticationApi } from '@rbx/client-auth/v1';
import { UsersApi } from '@rbx/client-users/v1';
import { Configuration } from '@rbx/clients-core';
import { FC, PropsWithChildren } from 'react';

import { unifiedLogger } from '@clients/unifiedLogger';
import { getClientIdForEnv } from '@services/auth/appAuthDataService';
import { GetBEDEV1ServiceBasePath, GetBEDEV2ServiceBasePath } from '@utils/url';

const store = initializeAuthStore();

const authenticationClient = new AuthenticationApi(
  new Configuration({
    basePath: GetBEDEV1ServiceBasePath('auth'),
    credentials: 'include',
    unifiedLogger,
  }),
);
const discoveryClient = new DiscoveryApi(
  new Configuration({
    basePath: GetBEDEV2ServiceBasePath('oauth'),
    credentials: 'include',
    unifiedLogger,
  }),
);

const usersClient = new UsersApi(
  new Configuration({
    basePath: GetBEDEV1ServiceBasePath('users'),
    credentials: 'include',
    unifiedLogger,
  }),
);

const RobloxAuthenticationProvider: FC<PropsWithChildren> = ({ children }) => (
  <BaseAuthenticationProvider
    authenticationClient={authenticationClient}
    clientId={getClientIdForEnv()}
    discoveryClient={discoveryClient}
    store={store}
    usersClient={usersClient}>
    {children}
  </BaseAuthenticationProvider>
);

export default RobloxAuthenticationProvider;
