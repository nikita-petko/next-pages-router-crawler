import type { useRobloxAuthentication } from '@rbx/auth';

export type TBuildTarget = 'luobu' | 'global';

// NOTE (@mbae, 07/24/24): Simplified this to just 3 environments.
// 'development' maps to ST3, and 'staging' maps to ST1
export type TTargetEnvironment = 'development' | 'staging' | 'production';
export type TRobloxEnvironment =
  | 'development'
  | 'sitetest3'
  | 'sitetest2'
  | 'sitetest1'
  | 'production';

export const ProductKey = {
  CreatorHub: 'CreatorHub',
  Home: 'Home',
  DataCollection: 'DataCollection',
  CreatorDashboard: 'CreatorDashboard',
  Documentation: 'Documentation',
  Store: 'Store',
  Talent: 'Talent',
  CommunityEvents: 'CommunityEvents',
  Forum: 'Forum',
  Updates: 'Updates',
  RoadMap: 'RoadMap',
  Assistant: 'Assistant',
  Community: 'Community',
  CreatorEvents: 'CreatorEvents',
  Music: 'Music',
  Explore: 'Explore',
  Licenses: 'Licenses',
  Advertise: 'Advertise',
  Collaboration: 'Collaboration',
} as const;

export type TProductKey = (typeof ProductKey)[keyof typeof ProductKey];

export type TUser = ReturnType<typeof useRobloxAuthentication>['user'];

export type { TSignalRCallback } from '@rbx/signalr-userhub-client';
