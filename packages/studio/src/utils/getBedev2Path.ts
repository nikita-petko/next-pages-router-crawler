import { RobloxEnvironment, TRobloxEnvironment } from '../types';

const getBedev2Path = (env: TRobloxEnvironment) => {
  if (env === RobloxEnvironment.Production) {
    return 'https://apis.roblox.com';
  }
  return `https://apis.${env}.robloxlabs.com`;
};

export default getBedev2Path;
