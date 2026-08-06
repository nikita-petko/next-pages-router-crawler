import type { TTargetEnvironment } from './types';

export enum RealTimeNotificationsBasePath {
  Production = 'https://realtime-signalr.roblox.com/userhub',
  Staging = 'https://snc2-realtime-signalr.sitetest1.robloxlabs.com/userhub',
  Development = 'https://realtime-signalr.sitetest3.robloxlabs.com/userhub',
}

const basePaths: Record<TTargetEnvironment, RealTimeNotificationsBasePath> = {
  production: RealTimeNotificationsBasePath.Production,
  staging: RealTimeNotificationsBasePath.Staging,
  development: RealTimeNotificationsBasePath.Development,
};

export function getRealTimeNotificationsBasePath(environment: TTargetEnvironment) {
  return basePaths[environment];
}
export default getRealTimeNotificationsBasePath;
