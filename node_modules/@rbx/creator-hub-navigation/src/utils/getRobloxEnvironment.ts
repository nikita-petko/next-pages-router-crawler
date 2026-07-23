import type { TRobloxEnvironment, TTargetEnvironment } from '../types';

const getRobloxEnvironment = (environment: TTargetEnvironment): TRobloxEnvironment => {
  if (environment === 'development') {
    return 'sitetest3';
  }

  if (environment === 'staging') {
    return 'sitetest1';
  }

  return 'production';
};

export default getRobloxEnvironment;
