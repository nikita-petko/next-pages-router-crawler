import { InBrowser } from '@utils/browser';

export enum EnvEnum {
  DEVELOPMENT = 'DEVELOPMENT',
  PRODUCTION = 'PRODUCTION',
  STAGING = 'STAGING',
}

export const IsLocalhostHost = (host?: string | null): boolean =>
  Boolean(host?.includes('localhost'));

export const IsLocalDeveloperToolsEnvEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_ENABLE_LOCAL_DEV_TOOLS === 'true';

export const IsMSWMockResponsesEnabled = () => {
  const inBrowser = InBrowser();
  const isLocalhost = inBrowser && IsLocalhostHost(window.location.hostname);
  const envEnabled = process.env.NEXT_PUBLIC_ENABLE_MSW_MOCK_REQUESTS === 'true';
  return inBrowser && isLocalhost && envEnabled;
};

export const IsLocalDeveloperToolsEnabled = () => {
  const inBrowser = InBrowser();
  const isLocalhost = inBrowser && IsLocalhostHost(window.location.hostname);
  const envEnabled = IsLocalDeveloperToolsEnvEnabled();
  return inBrowser && isLocalhost && envEnabled;
};

export const IsLocalhostAndMockProd = () =>
  InBrowser() &&
  IsLocalhostHost(window.location.hostname) &&
  process.env.NEXT_PUBLIC_MOCK_PROD === 'true';

export const GetCurrentEnv = () => {
  if (IsLocalhostAndMockProd()) {
    return EnvEnum.PRODUCTION;
  }
  const setEnv = process.env.BUILD_ENV || process.env.NEXT_PUBLIC_TARGET_ENV;

  if (setEnv) {
    switch (setEnv) {
      case 'development':
        return EnvEnum.DEVELOPMENT;
      case 'staging':
        return EnvEnum.STAGING;
      default:
        return EnvEnum.PRODUCTION;
    }
  }

  if (InBrowser()) {
    const currHostname = window.location.hostname;

    if (currHostname.includes('sitetest3')) {
      return EnvEnum.DEVELOPMENT;
    }
    if (currHostname.includes('sitetest1')) {
      return EnvEnum.STAGING;
    }
    if (currHostname.includes('roblox.com')) {
      return EnvEnum.PRODUCTION;
    }
  }

  return EnvEnum.PRODUCTION;
};

/** Non-production hosts (localhost, sitetest1, sitetest3) and non-prod build targets. */
export const IsMetadataOverridesEnabled = (): boolean => GetCurrentEnv() !== EnvEnum.PRODUCTION;
