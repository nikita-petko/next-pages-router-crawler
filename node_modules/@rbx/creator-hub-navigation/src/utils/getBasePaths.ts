import type { TBuildTarget, TRobloxEnvironment, TTargetEnvironment } from '../types';
import getRobloxSiteDomain from './getRobloxSiteDomain';

export function getBEDEV2ServiceBasePath(
  serviceName: string,
  target: TBuildTarget,
  environment: TTargetEnvironment,
) {
  if (environment === 'production') {
    return target === 'luobu'
      ? `https://apis.api.robloxdev.cn/${serviceName}`
      : `https://apis.roblox.com/${serviceName}`;
  }

  if (environment === 'staging') {
    return target === 'luobu'
      ? `https://apis.robloxlabs.cn/${serviceName}`
      : `https://apis.sitetest1.robloxlabs.com/${serviceName}`;
  }

  return target === 'luobu'
    ? `https://apis.luobutest.robloxlabs.cn/${serviceName}`
    : `https://apis.sitetest3.robloxlabs.com/${serviceName}`;
}

export const globalCreatorHubBasePath = 'https://create.roblox.com';
export const globalCreatorHubBasePathStaging = 'https://create.sitetest1.robloxlabs.com';
export const globalCreatorHubBasePathDevelopment = 'https://create.sitetest3.robloxlabs.com';
export const luobuCreatorHubBasePath = 'https://create.robloxdev.cn';
export const luobuCreatorHubBasePathStaging = 'https://create.robloxlabs.cn';
export const luobuCreatorHubBasePathDevelopment = 'https://create.luobutest.robloxlabs.cn';

export function getCreatorHubBasePath(target: TBuildTarget, environment: TTargetEnvironment) {
  if (target === 'luobu') {
    if (environment === 'production') {
      return luobuCreatorHubBasePath;
    }

    if (environment === 'staging') {
      return luobuCreatorHubBasePathStaging;
    }

    return luobuCreatorHubBasePathDevelopment;
  }

  if (typeof window !== 'undefined' && window?.location?.origin) {
    if (window.location.host.startsWith('devforum') || window.location.host.startsWith('music')) {
      return window.location.origin.replace(/(devforum|music)/, 'create'); // regex to replace music or devforum with create
    }
    return window.location.origin;
  }

  if (environment === 'production') {
    return globalCreatorHubBasePath;
  }

  if (environment === 'staging') {
    return globalCreatorHubBasePathStaging;
  }

  return globalCreatorHubBasePathDevelopment;
}

export function getEventBasePath(target: TBuildTarget, environment: TTargetEnvironment) {
  const robloxSiteDomain = getRobloxSiteDomain(target, environment);
  return `https://ecsv2.${robloxSiteDomain}`;
}

export const getAdsPath = (environment: TRobloxEnvironment): string => {
  if (environment === 'production') {
    return 'https://advertise.roblox.com/';
  }

  let env = environment;
  if (environment === 'sitetest2' || environment === 'development') {
    env = 'sitetest1';
  }
  return `https://advertise.${env}.robloxlabs.com/`;
};

export const getCreatorHubBasePathV2 = (
  target: TBuildTarget,
  environment: TRobloxEnvironment,
): string => {
  if (target === 'luobu') {
    if (environment === 'production') {
      return 'https://create.robloxdev.cn/';
    }
    if (environment === 'sitetest1' || environment === 'development') {
      return 'https://create.robloxlabs.cn/';
    }
    return 'https://create.luobutest.robloxlabs.cn/';
  }

  if (environment === 'production') {
    return 'https://create.roblox.com/';
  }

  const env = environment === 'development' ? 'sitetest1' : environment;
  return `https://create.${env}.robloxlabs.com/`;
};

export const getDevForumBasePath = (environment: TRobloxEnvironment) => {
  if (environment === 'production') {
    return 'https://devforum.roblox.com';
  }

  if (environment === 'sitetest3') {
    return 'https://devforum.sitetest3.robloxlabs.com/';
  }

  return 'https://devforum.sitetest1.robloxlabs.com/';
};

export function getRobloxSiteDomainV2(target: TBuildTarget, environment: TRobloxEnvironment) {
  if (target === 'luobu') {
    if (environment === 'production') {
      return 'roblox.qq.com';
    }
    if (environment === 'sitetest1' || environment === 'development') {
      return 'robloxlabs.cn';
    }
    return 'luobutest.robloxlabs.cn';
  }

  if (environment === 'production') {
    return 'roblox.com';
  }
  const env = environment === 'development' ? 'sitetest1' : environment;
  return `${env}.robloxlabs.com`;
}

export function getEventBasePathV2(target: TBuildTarget, environment: TRobloxEnvironment) {
  const robloxSiteDomain = getRobloxSiteDomainV2(target, environment);
  return `https://ecsv2.${robloxSiteDomain}`;
}

export function getBEDEV2ServiceBasePathV2(
  serviceName: string,
  target: TBuildTarget,
  environment: TRobloxEnvironment,
) {
  if (environment === 'production') {
    return target === 'luobu'
      ? `https://apis.api.robloxdev.cn/${serviceName}`
      : `https://apis.roblox.com/${serviceName}`;
  }

  if (target === 'luobu') {
    if (environment === 'sitetest1' || environment === 'development') {
      return `https://apis.robloxlabs.cn/${serviceName}`;
    }
    return `https://apis.luobutest.robloxlabs.cn/${serviceName}`;
  }

  const env = environment === 'development' ? 'sitetest1' : environment;
  return `https://apis.${env}.robloxlabs.com/${serviceName}`;
}

export function getBEDEV1ServiceBasePath(
  serviceName: string,
  target: TBuildTarget,
  environment: TRobloxEnvironment,
) {
  if (environment === 'production') {
    return target === 'luobu'
      ? `https://${serviceName}.api.robloxdev.cn${serviceName}`
      : `https://${serviceName}.roblox.com`;
  }

  if (target === 'luobu') {
    if (environment === 'sitetest1' || environment === 'development') {
      return `https://${serviceName}.robloxlabs.cn`;
    }
    return `https://${serviceName}.luobutest.robloxlabs.cn`;
  }

  const env = environment === 'development' ? 'sitetest1' : environment;
  return `https://${serviceName}.${env}.robloxlabs.com`;
}
