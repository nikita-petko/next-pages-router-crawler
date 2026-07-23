import type { TRobloxEnvironment, TRobloxTarget } from '../types';
import { RobloxEnvironment, RobloxTarget } from '../types';

export const globalClientIds: Record<TRobloxEnvironment, string> = {
  [RobloxEnvironment.Sitetest1]: '5248896133416875863',
  [RobloxEnvironment.Sitetest2]: '3992715735343249042',
  [RobloxEnvironment.Sitetest3]: '5462362171564719537',
  [RobloxEnvironment.Production]: '7968549422692352298',
};

export const luobuClientIds: Record<TRobloxEnvironment, string> = {
  [RobloxEnvironment.Sitetest1]: '6593031293946509533',
  [RobloxEnvironment.Sitetest2]: '6280195288255344888',
  [RobloxEnvironment.Sitetest3]: '5437780827214302073',
  [RobloxEnvironment.Production]: '6154550030602747221',
};

export const getClientId = (env: TRobloxEnvironment, target: TRobloxTarget) => {
  if (target === RobloxTarget.Luobu) {
    return luobuClientIds[env];
  }

  return globalClientIds[env];
};
