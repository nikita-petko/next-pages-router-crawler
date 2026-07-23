import { TargetEnvironment } from '@rbx/video-player';

import { InBrowser } from '@utils/browser';
import { EnvEnum, GetCurrentEnv, IsLocalhostAndMockProd } from '@utils/env';

export const GetApiSiteBaseUrl = (): string => {
  switch (GetCurrentEnv()) {
    case EnvEnum.DEVELOPMENT:
      return 'https://apis.sitetest3.robloxlabs.com';
    case EnvEnum.STAGING:
      return 'https://apis.sitetest1.robloxlabs.com';
    default:
      return 'https://apis.roblox.com';
  }
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

export const GetRedirectBaseUrl = (): string => {
  const currHostname = window.location.hostname;

  if (currHostname && currHostname.includes('localhost')) {
    switch (GetCurrentEnv()) {
      case EnvEnum.DEVELOPMENT:
        return 'https://localhost.sitetest3.robloxlabs.com:3000';
      case EnvEnum.STAGING:
        return 'https://localhost.sitetest1.robloxlabs.com:3000';
      default:
        return 'https://localhost:3000';
    }
  }

  switch (GetCurrentEnv()) {
    case EnvEnum.DEVELOPMENT:
      return 'https://create.sitetest3.robloxlabs.com/advertise';
    case EnvEnum.STAGING:
      return 'https://create.sitetest1.robloxlabs.com/advertise';
    default:
      return 'https://create.roblox.com/advertise';
  }
};

export const GetUrlWithParams = (
  url: string,
  params: { [key: string]: string | null | undefined },
): string => {
  const searchParams = new URLSearchParams();

  Object.keys(params).forEach((key) => {
    const param = params[key];
    if (param !== null && param !== undefined) {
      searchParams.append(key, param);
    }
  });

  return searchParams.toString() ? `${url}?${searchParams.toString()}` : url;
};

const useLocalToProd =
  process.env.environment === 'development' && process.env.NEXT_PUBLIC_API_BACKEND === 'production';

export const GetBEDEV1ServiceBasePath = (serviceName: string) => {
  if (IsLocalhostAndMockProd()) {
    return `https://${serviceName}.roblox.com`;
  }
  if (InBrowser()) {
    const currHostname = window.location.hostname;

    if (currHostname.includes('sitetest1')) {
      return `https://${serviceName}.sitetest1.robloxlabs.com`;
    }
    if (currHostname.includes('sitetest3')) {
      return `https://${serviceName}.sitetest3.robloxlabs.com`;
    }
    if (currHostname.includes('roblox.com')) {
      return `https://${serviceName}.roblox.com`;
    }
  }

  if (useLocalToProd || process.env.environment === 'production') {
    return `https://${serviceName}.roblox.com`;
  }
  if (process.env.environment === 'staging') {
    return `https://${serviceName}.sitetest1.robloxlabs.com`;
  }
  return `https://${serviceName}.sitetest3.robloxlabs.com`;
};

export const GetBEDEV2ServiceBasePath = (serviceName: string) => {
  switch (GetCurrentEnv()) {
    case EnvEnum.DEVELOPMENT:
      return `https://apis.sitetest3.robloxlabs.com/${serviceName}`;
    case EnvEnum.STAGING:
      return `https://apis.sitetest1.robloxlabs.com/${serviceName}`;
    default:
      return `https://apis.roblox.com/${serviceName}`;
  }
};

export const GetModerationUrl = (): string => {
  switch (GetCurrentEnv()) {
    case EnvEnum.DEVELOPMENT:
      return 'https://usermoderation.sitetest3.robloxlabs.com/v2/not-approved';
    case EnvEnum.STAGING:
      return 'https://usermoderation.sitetest1.robloxlabs.com/v2/not-approved';
    default:
      return 'https://usermoderation.roblox.com/v2/not-approved';
  }
};

export const GetVideoPlayerEnvEnum = (): TargetEnvironment => {
  switch (GetCurrentEnv()) {
    case EnvEnum.DEVELOPMENT:
      return 'sitetest3';
    case EnvEnum.STAGING:
      return 'sitetest1';
    default:
      return 'production';
  }
};
