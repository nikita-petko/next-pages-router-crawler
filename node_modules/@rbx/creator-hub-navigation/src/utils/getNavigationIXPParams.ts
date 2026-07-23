import type { CreatorHubSearchIxpParams } from '@rbx/creator-hub-search';
import { DEFAULT_CREATOR_HUB_SEARCH_VERSION } from '@rbx/creator-hub-search';
import type { TBuildTarget, TProductKey, TTargetEnvironment } from '../types';
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

enum TalentHubIXPParameters {
  enableTalentHubV2M2 = 'enableTalentHubV2M2',
}

export type TNavigationIXPResults = {
  [NavigationIXPParameters.enableNotificationsM2]: boolean | null;
  [NavigationIXPParameters.enableAssistant]: boolean;
  [NavigationIXPParameters.disableProducts]: string[] | null;
  [NavigationIXPParameters.enableLuobu]: boolean | null;
  [NavigationIXPParameters.creatorEventsVariant]: string | null; // 'tab', 'dropdown', 'control'
  [NavigationIXPParameters.enableCourses]: boolean | null;
  [NavigationIXPParameters.enableAdsManager]: boolean | null;
  [TalentHubIXPParameters.enableTalentHubV2M2]: boolean | number | null;
  creatorHubSearchIxpParams: CreatorHubSearchIxpParams;
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
  enableTalentHubV2M2: false,
  creatorHubSearchIxpParams: DEFAULT_CREATOR_HUB_SEARCH_VERSION,
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
  const [
    ixpParams,
    ixpParamsByUser,
    ixpParamsByUserId,
    ixpParamsCreatorHubSearchLayer,
    ixpParamsTalentHubLayer,
  ] = await Promise.allSettled([
    fetchNavigationIXPParametersForLayer('CreatorHub.Navigation', target, environment, params),
    fetchNavigationIXPParametersForLayer('CreatorHub.Navigation.User', target, environment, params),
    fetchNavigationIXPParametersForLayer(
      'CreatorHub.CreatorDocumentation.UserId',
      target,
      environment,
      { enableCourses: 'enableCourses' },
    ),
    fetchNavigationIXPParametersForLayer(
      'CreatorHub.CreatorDocumentation.Search.UserId',
      target,
      environment,
      { searchVersion: 'searchVersion' },
    ),
    fetchNavigationIXPParametersForLayer(
      'CreatorHub.TalentHub.UserId',
      target,
      environment,
      TalentHubIXPParameters,
    ),
  ]);

  if (
    ixpParams.status === 'fulfilled' &&
    ixpParamsByUser.status === 'fulfilled' &&
    ixpParamsByUserId.status === 'fulfilled' &&
    ixpParamsCreatorHubSearchLayer.status === 'fulfilled' &&
    ixpParamsTalentHubLayer.status === 'fulfilled'
  ) {
    return {
      ixpParamsValue: ixpParams.value,
      ixpParamsByUserValue: ixpParamsByUser.value,
      ixpParamsByUserIdValue: ixpParamsByUserId.value,
      ixpParamsCreatorHubSearchValue: ixpParamsCreatorHubSearchLayer.value,
      ixpParamsTalentHubValue: ixpParamsTalentHubLayer.value,
    };
  }
  return null;
}

async function getNavigationConfigsUncached(target: TBuildTarget, environment: TTargetEnvironment) {
  const res = await getNavigationIXPParamsUncached(target, environment, NavigationIXPParameters);
  if (res) {
    const {
      ixpParamsValue,
      ixpParamsByUserValue,
      ixpParamsByUserIdValue,
      ixpParamsCreatorHubSearchValue,
      ixpParamsTalentHubValue,
    } = res;

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
      enableTalentHubV2M2: ixpParamsTalentHubValue?.enableTalentHubV2M2 ?? false,
      creatorHubSearchIxpParams:
        ixpParamsCreatorHubSearchValue?.searchVersion ?? DEFAULT_CREATOR_HUB_SEARCH_VERSION,
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
