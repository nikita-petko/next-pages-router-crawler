import type { TBuildTarget, TTargetEnvironment } from '../types';

const robloxSiteDomain = 'roblox.com';
const robloxSiteDomainStaging = 'sitetest1.robloxlabs.com';
const robloxSiteDomainDevelopment = 'sitetest3.robloxlabs.com';
const luobuSiteDomain = 'roblox.qq.com';
const luobuSiteDomainStaging = 'robloxlabs.cn';
const luobuSiteDomainDevelopment = 'luobutest.robloxlabs.cn';

function getRobloxSiteDomain(target: TBuildTarget, environment: TTargetEnvironment) {
  if (environment === 'production') {
    return target === 'luobu' ? luobuSiteDomain : robloxSiteDomain;
  }

  if (environment === 'staging') {
    return target === 'luobu' ? luobuSiteDomainStaging : robloxSiteDomainStaging;
  }

  return target === 'luobu' ? luobuSiteDomainDevelopment : robloxSiteDomainDevelopment;
}
export default getRobloxSiteDomain;
