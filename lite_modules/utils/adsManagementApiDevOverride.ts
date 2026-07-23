import { Configuration, HTTPHeaders, Middleware } from '@rbx/clients-core';

import { InBrowser } from '@utils/browser';
import {
  IsLocalDeveloperToolsEnabled,
  IsLocalDeveloperToolsEnvEnabled,
  IsLocalhostHost,
} from '@utils/env';
import { GetApiSiteBaseUrl, GetSitetestBaseUrl } from '@utils/url';

const ADS_MANAGEMENT_API_PATH = '/ads-management-api';
const DEFAULT_LOCALHOST_PORT = '20907';
// Dev-only string literals are intentionally NOT lifted to module-scope consts
// exported from this file: the client bundle imports non-dev helpers from here
// (getAdsManagementApiBaseUrl, createAdsManagementApiConfiguration, ...), which
// keeps the module alive in the browser. Any `export const` binding defined at
// the top level survives tree-shaking even when no client code references it,
// leaking strings like 'x-ama-dev-proxy-port' or '/api/dev-proxy/...' into the
// production bundle. Inlining literals at each use site inside dev-gated
// branches lets SWC strip the strings together with the dead branch.
// The proxy-port header name lives in the API route file itself since that's
// the only non-test consumer.

// NOTE: Dev-tools gating is intentionally done with inline
// `process.env.NEXT_PUBLIC_ENABLE_LOCAL_DEV_TOOLS !== 'true'` checks at each
// call site rather than a module-scope constant. Next.js's SWC minifier
// folds the inlined `'false' !== 'true'` comparison and DCEs the unreachable
// branch in one pass; it does not reliably propagate a folded module-scope
// `const` into every function scope that references it, which would leave
// dev-only code (and any string literals it contains) in the production
// browser bundle.

export enum AdsManagementApiDevOverrideTarget {
  DEFAULT = 'default',
  LOCALHOST = 'localhost',
}

export interface AdsManagementApiDevOverrideSettings {
  authenticatedUserId: string;
  localhostPort: string;
  target: AdsManagementApiDevOverrideTarget;
}

const defaultSettings: AdsManagementApiDevOverrideSettings = {
  authenticatedUserId: '',
  localhostPort: DEFAULT_LOCALHOST_PORT,
  target: AdsManagementApiDevOverrideTarget.DEFAULT,
};

export const isAdsManagementApiDevOverridePortValid = (port: string): boolean => {
  if (!/^\d+$/.test(port)) {
    return false;
  }

  const parsedPort = Number(port);
  return parsedPort >= 1 && parsedPort <= 65535;
};

const sanitizePort = (port: string | undefined): string => {
  if (!port) {
    return '';
  }

  return port.replace(/\D/g, '').slice(0, 5);
};

const sanitizeAuthenticatedUserId = (authenticatedUserId: string | number | undefined): string => {
  if (authenticatedUserId === undefined || authenticatedUserId === null) {
    return '';
  }

  return String(authenticatedUserId).trim();
};

const sanitizeSettings = (
  settings: Partial<AdsManagementApiDevOverrideSettings> | null | undefined,
): AdsManagementApiDevOverrideSettings => {
  const target =
    settings?.target === AdsManagementApiDevOverrideTarget.LOCALHOST
      ? AdsManagementApiDevOverrideTarget.LOCALHOST
      : AdsManagementApiDevOverrideTarget.DEFAULT;
  const localhostPort = sanitizePort(settings?.localhostPort);

  return {
    authenticatedUserId: sanitizeAuthenticatedUserId(settings?.authenticatedUserId),
    localhostPort,
    target:
      target === AdsManagementApiDevOverrideTarget.LOCALHOST &&
      !isAdsManagementApiDevOverridePortValid(localhostPort)
        ? AdsManagementApiDevOverrideTarget.DEFAULT
        : target,
  };
};

const readSettingsFromStorage = (): AdsManagementApiDevOverrideSettings => {
  if (!InBrowser()) {
    return defaultSettings;
  }

  const rawSettings = window.localStorage.getItem('adsManagementApiDevOverride');
  if (!rawSettings) {
    return defaultSettings;
  }

  try {
    return sanitizeSettings(JSON.parse(rawSettings));
  } catch {
    return defaultSettings;
  }
};

const writeSettingsToStorage = (settings: AdsManagementApiDevOverrideSettings): void => {
  if (!InBrowser()) {
    return;
  }

  window.localStorage.setItem('adsManagementApiDevOverride', JSON.stringify(settings));
};

const mergeHeaders = (
  headers: HeadersInit | undefined,
  additionalHeaders: HTTPHeaders,
): Headers => {
  const mergedHeaders = new Headers(headers);

  Object.entries(additionalHeaders).forEach(([key, value]) => {
    mergedHeaders.set(key, value);
  });

  return mergedHeaders;
};

export const getAdsManagementApiDevOverrideSettings = (): AdsManagementApiDevOverrideSettings => {
  if (process.env.NEXT_PUBLIC_ENABLE_LOCAL_DEV_TOOLS !== 'true') {
    return defaultSettings;
  }

  return readSettingsFromStorage();
};

export const updateAdsManagementApiDevOverrideSettings = (
  updates: Partial<AdsManagementApiDevOverrideSettings>,
): AdsManagementApiDevOverrideSettings => {
  if (process.env.NEXT_PUBLIC_ENABLE_LOCAL_DEV_TOOLS !== 'true') {
    return defaultSettings;
  }

  const nextSettings = sanitizeSettings({
    ...readSettingsFromStorage(),
    ...updates,
  });

  writeSettingsToStorage(nextSettings);
  return nextSettings;
};

export const setAdsManagementApiAuthenticatedUserId = (
  authenticatedUserId: number | undefined,
): AdsManagementApiDevOverrideSettings => {
  if (process.env.NEXT_PUBLIC_ENABLE_LOCAL_DEV_TOOLS !== 'true') {
    return defaultSettings;
  }

  return updateAdsManagementApiDevOverrideSettings({
    authenticatedUserId: sanitizeAuthenticatedUserId(authenticatedUserId),
  });
};

const getAdsManagementApiDefaultSiteBaseUrl = (): string => GetApiSiteBaseUrl();

function isAdsManagementApiLocalOverrideEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_LOCAL_DEV_TOOLS !== 'true') {
    return false;
  }

  if (!IsLocalDeveloperToolsEnabled()) {
    return false;
  }

  const settings = getAdsManagementApiDevOverrideSettings();
  return (
    settings.target === AdsManagementApiDevOverrideTarget.LOCALHOST &&
    isAdsManagementApiDevOverridePortValid(settings.localhostPort)
  );
}

export const getAdsManagementApiRequestCredentials = (): RequestCredentials => {
  if (process.env.NEXT_PUBLIC_ENABLE_LOCAL_DEV_TOOLS !== 'true') {
    return 'include';
  }

  return isAdsManagementApiLocalOverrideEnabled() ? 'omit' : 'include';
};

export const shouldAdsManagementApiSendCredentials = (): boolean => {
  if (process.env.NEXT_PUBLIC_ENABLE_LOCAL_DEV_TOOLS !== 'true') {
    return true;
  }

  return getAdsManagementApiRequestCredentials() === 'include';
};

export const buildAdsManagementApiLocalhostUpstreamBaseUrl = (localhostPort: string): string =>
  `http://localhost:${localhostPort}`;

const getAdsManagementApiSiteBaseUrl = (): string => {
  if (!isAdsManagementApiLocalOverrideEnabled()) {
    return getAdsManagementApiDefaultSiteBaseUrl();
  }

  return '/api/dev-proxy/ads-management-api';
};

export const getAdsManagementApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_ENABLE_LOCAL_DEV_TOOLS !== 'true') {
    return `${getAdsManagementApiDefaultSiteBaseUrl()}${ADS_MANAGEMENT_API_PATH}`;
  }

  return isAdsManagementApiLocalOverrideEnabled()
    ? getAdsManagementApiSiteBaseUrl()
    : `${getAdsManagementApiSiteBaseUrl()}${ADS_MANAGEMENT_API_PATH}`;
};

const getAdsManagementApiDevHeaders = (): HTTPHeaders => {
  if (process.env.NEXT_PUBLIC_ENABLE_LOCAL_DEV_TOOLS !== 'true') {
    return {};
  }

  if (!isAdsManagementApiLocalOverrideEnabled()) {
    return {};
  }

  const { authenticatedUserId } = getAdsManagementApiDevOverrideSettings();
  if (!authenticatedUserId) {
    return {};
  }

  return {
    'robloxctx-age-bracket': 'Age13OrOver',
    'robloxctx-authenticated-userid': authenticatedUserId,
  };
};

export const getAdsManagementApiRequestHeaders = (): HTTPHeaders => {
  if (process.env.NEXT_PUBLIC_ENABLE_LOCAL_DEV_TOOLS !== 'true') {
    return {};
  }

  if (!isAdsManagementApiLocalOverrideEnabled()) {
    return {};
  }

  const { localhostPort } = getAdsManagementApiDevOverrideSettings();
  return {
    ...getAdsManagementApiDevHeaders(),
    'x-ama-dev-proxy-port': localhostPort,
  };
};

export const isAdsManagementApiProxyRequestAllowed = (host?: string | null): boolean =>
  IsLocalDeveloperToolsEnvEnabled() &&
  process.env.NODE_ENV !== 'production' &&
  IsLocalhostHost(host);

export const createAdsManagementApiConfiguration = (): Configuration => {
  if (process.env.NEXT_PUBLIC_ENABLE_LOCAL_DEV_TOOLS !== 'true') {
    return new Configuration({
      basePath: getAdsManagementApiBaseUrl(),
      credentials: 'include',
      robloxSiteDomain: GetSitetestBaseUrl(),
    });
  }

  const middleware: Middleware = {
    pre: async (context) => {
      const requestHeaders = getAdsManagementApiRequestHeaders();
      if (Object.keys(requestHeaders).length === 0) {
        return undefined;
      }

      return {
        init: {
          ...context.init,
          headers: mergeHeaders(context.init.headers, requestHeaders),
        },
        url: context.url,
      };
    },
  };

  return new Configuration({
    basePath: getAdsManagementApiBaseUrl(),
    credentials: getAdsManagementApiRequestCredentials(),
    headers: getAdsManagementApiRequestHeaders(),
    middleware: [middleware],
    robloxSiteDomain: GetSitetestBaseUrl(),
  });
};
