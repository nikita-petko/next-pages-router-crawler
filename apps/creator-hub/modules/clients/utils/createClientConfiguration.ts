import { Configuration } from '@rbx/clients-core';
import type { Middleware } from '@rbx/clients-core';
import { registerMrRouterDevConsole } from '@rbx/clients-core/mr-router';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { getBEDEV1ServiceBasePath, getBEDEV2ServiceBasePath } from './getBasePaths';

let mrRouterConsoleRegistered = false;

type ServiceType = 'bedev1' | 'bedev2';

type CreateClientConfigurationOptions = {
  middleware?: Middleware[];
  credentials?: RequestCredentials;
  enableMrRouter?: boolean;
  enableBoundAuthToken?: boolean;
  boundAuthTokenLoadTimeout?: number;
  boundAuthTokenDataTimeout?: number;
};

export function createClientConfiguration(
  serviceName: string,
  serviceType: ServiceType,
  options?: CreateClientConfigurationOptions,
): Configuration {
  const basePath =
    serviceType === 'bedev1'
      ? getBEDEV1ServiceBasePath(serviceName)
      : getBEDEV2ServiceBasePath(serviceName);

  const enableMrRouter = options?.enableMrRouter ?? true;

  if (
    enableMrRouter &&
    !mrRouterConsoleRegistered &&
    process.env.targetEnvironment !== 'production'
  ) {
    registerMrRouterDevConsole();
    mrRouterConsoleRegistered = true;
  }

  return new Configuration({
    robloxSiteDomain: process.env.robloxSiteDomain,
    basePath,
    credentials: options?.credentials ?? 'include',
    unifiedLogger: unifiedLoggerClient,
    enableMrRouter,
    ...(options?.middleware && { middleware: options.middleware }),
    ...(options?.enableBoundAuthToken !== undefined && {
      enableBoundAuthToken: options.enableBoundAuthToken,
    }),
    ...(options?.boundAuthTokenLoadTimeout !== undefined && {
      boundAuthTokenLoadTimeout: options.boundAuthTokenLoadTimeout,
    }),
    ...(options?.boundAuthTokenDataTimeout !== undefined && {
      boundAuthTokenDataTimeout: options.boundAuthTokenDataTimeout,
    }),
  });
}
