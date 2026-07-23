enum EnvEnum {
  DEVELOPMENT = 'DEVELOPMENT',
  PRODUCTION = 'PRODUCTION',
  STAGING = 'STAGING',
}

const InBrowser = (): boolean => typeof window !== 'undefined';

const IsLocalhostAndMockProd = (): boolean =>
  InBrowser() &&
  window.location.hostname.includes('localhost') &&
  process.env.NEXT_PUBLIC_MOCK_PROD === 'true';

export const GetCurrentEnv = (): EnvEnum => {
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

export const GetSitetestBaseUrl = (): string => {
  switch (GetCurrentEnv()) {
    case EnvEnum.DEVELOPMENT:
      return 'sitetest3.robloxlabs.com';
    case EnvEnum.STAGING:
      return 'sitetest1.robloxlabs.com';
    default:
      return 'roblox.com';
  }
};
