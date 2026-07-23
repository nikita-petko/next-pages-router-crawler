import { InBrowser } from '@utils/browser';

enum EnvEnum {
  DEVELOPMENT = 'DEVELOPMENT',
  PRODUCTION = 'PRODUCTION',
  STAGING = 'STAGING',
}

export const IsLocalhostAndMockProd = () =>
  InBrowser() &&
  window.location.hostname.includes('localhost') &&
  process.env.NEXT_PUBLIC_MOCK_PROD === 'true';

const getCurrentEnv = (): EnvEnum => {
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

// JIRA for context ADS-6947
export const getThumbnailsClientBatchSize = (): number => {
  switch (getCurrentEnv()) {
    case EnvEnum.DEVELOPMENT:
      return 10;
    case EnvEnum.STAGING:
      return 50;
    default:
      return 100;
  }
};
