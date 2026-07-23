import { TBuildTarget, TProductKey, TTargetEnvironment } from '../types';
import { getBEDEV2ServiceBasePath } from './getBasePaths';
import * as localStorageUtils from './localStorage';

export type NavigationConfigsProviderProps = {
  environment: TTargetEnvironment;
  target: TBuildTarget;
  currentProduct: TProductKey;
};

enum NavigationIXPParameters {
  disableProducts = 'disableProducts',
  enableLuobu = 'enableLuobu',
  creatorEventsVariant = 'creatorEventsVariant',
  enableAssistant = 'enableAssistant',
  enableCourses = 'enableCourses',
  enableAdsManager = 'enableAdsManager',
  enableNotificationsM2 = 'enableNotificationsM2',
}

export type TNavigationIXPResults = {
  [NavigationIXPParameters.enableNotificationsM2]: boolean | null;
  [NavigationIXPParameters.enableAssistant]: boolean;
  [NavigationIXPParameters.disableProducts]: string[] | null;
  [NavigationIXPParameters.enableLuobu]: boolean | null;
  [NavigationIXPParameters.creatorEventsVariant]: string | null; // 'tab', 'dropdown', 'control'
  [NavigationIXPParameters.enableCourses]: boolean | null;
  [NavigationIXPParameters.enableAdsManager]: boolean | null;
  /** From CreatorHub.HomePage.UserId layer - true when AlertAndAnnouncement | AnnouncementOnly */
  showUpdatesInNav: boolean;
};
// update storage key everytime we change ixp params setup
export const storageKey = '_navigation';

export const defaultIXPParamsValue: TNavigationIXPResults = {
  enableAssistant: false,
  disableProducts: null,
  enableLuobu: null,
  creatorEventsVariant: null,
  enableCourses: false,
  enableNotificationsM2: false,
  enableAdsManager: false,
  showUpdatesInNav: false,
};

export async function fetchNavigationIXPParametersForLayer(
  layer: string,
  target: TBuildTarget,
  environment: TTargetEnvironment,
  params: Record<string, string>,
) {
  const baseURL = getBEDEV2ServiceBasePath('product-experimentation-platform', target, environment);
  const paramList = Object.values(params).join(',');
  const url = `${baseURL}/v1/projects/1/layers/${layer}/values?parameters=${paramList}`;
  const response = await fetch(url, {
    credentials: 'include',
  });
  return response.json();
}

export async function getNavigationIXPParamsUncached(
  target: TBuildTarget,
  environment: TTargetEnvironment,
  params: Record<string, string>,
) {
  const [ixpParams, ixpParamsByUser, ixpParamsByUserId] = await Promise.allSettled([
    fetchNavigationIXPParametersForLayer('CreatorHub.Navigation', target, environment, params),
    fetchNavigationIXPParametersForLayer('CreatorHub.Navigation.User', target, environment, params),
    fetchNavigationIXPParametersForLayer(
      'CreatorHub.CreatorDocumentation.UserId',
      target,
      environment,
      { enableCourses: 'enableCourses' },
    ),
  ]);

  if (
    ixpParams.status === 'fulfilled' &&
    ixpParamsByUser.status === 'fulfilled' &&
    ixpParamsByUserId.status === 'fulfilled'
  ) {
    return {
      ixpParamsValue: ixpParams.value,
      ixpParamsByUserValue: ixpParamsByUser.value,
      ixpParamsByUserIdValue: ixpParamsByUserId.value,
    };
  }
  return null;
}

// localStorage key used by the Homepage's useIXPParameters hook to cache the HomePage layer values.
// We read from this cache instead of fetching the layer directly to avoid triggering
// IXP enrollment outside the Homepage (which would dilute the experiment).
const HOMEPAGE_IXP_CACHE_KEY = 'CreatorHub.HomePage.UserId';

function getShowUpdatesInNavFromHomepageCache(): boolean {
  const homePageCache = localStorageUtils.get<{ AlertAnnouncementRedesign?: string }>(
    HOMEPAGE_IXP_CACHE_KEY,
  );
  const alertAnnouncementRedesign = homePageCache?.AlertAnnouncementRedesign;
  return alertAnnouncementRedesign != null && alertAnnouncementRedesign !== 'Control';
}

async function getNavigationConfigsUncached(target: TBuildTarget, environment: TTargetEnvironment) {
  const res = await getNavigationIXPParamsUncached(target, environment, NavigationIXPParameters);
  if (res) {
    const { ixpParamsValue, ixpParamsByUserValue, ixpParamsByUserIdValue } = res;

    return {
      disableProducts: ixpParamsValue.disableProducts || ixpParamsByUserValue.disableProducts || [],
      enableLuobu: ixpParamsValue.enableLuobu || ixpParamsByUserValue.enableLuobu || false,
      enableNotificationsM2:
        ixpParamsValue.enableNotificationsM2 || ixpParamsByUserValue.enableNotificationsM2 || false,
      enableAssistant:
        ixpParamsValue.enableAssistant || ixpParamsByUserValue.enableAssistant || false,
      creatorEventsVariant:
        ixpParamsValue.creatorEventsVariant || ixpParamsByUserValue.creatorEventsVariant || null,
      layoutVariant: ixpParamsValue.layoutVariant || ixpParamsByUserValue.layoutVariant || null,
      enableCourses: ixpParamsByUserIdValue?.enableCourses ?? false,
      enableAdsManager: ixpParamsValue?.enableAdsManager ?? false,
      showUpdatesInNav: getShowUpdatesInNavFromHomepageCache(),
    };
  }
  return null;
}

export function getNavigationIXPParams(
  target: TBuildTarget,
  environment: TTargetEnvironment,
  defaultValue = defaultIXPParamsValue,
): TNavigationIXPResults {
  // read ixp configs from cache storage or fallback to default
  const configs: TNavigationIXPResults = localStorageUtils.get(storageKey) ?? defaultValue;

  // async trigger ixp fetching and update cache for next time
  getNavigationConfigsUncached(target, environment).then((result) =>
    localStorageUtils.set(storageKey, result ?? defaultValue),
  );

  return configs;
}
