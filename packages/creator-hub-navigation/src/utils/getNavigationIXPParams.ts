import { z } from 'zod';
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
  enableNotificationsM2 = 'enableNotificationsM2',
}

enum TalentHubIXPParameters {
  enableTalentHubV2M2 = 'enableTalentHubV2M2',
}

const navigationIXPResultsSchema = z.object({
  [NavigationIXPParameters.enableNotificationsM2]: z.boolean().nullable().default(false),
  [NavigationIXPParameters.enableAssistant]: z.boolean().default(false),
  [NavigationIXPParameters.disableProducts]: z.array(z.string()).nullable().default(null),
  [NavigationIXPParameters.enableLuobu]: z.boolean().nullable().default(null),
  [NavigationIXPParameters.creatorEventsVariant]: z.string().nullable().default(null),
  [NavigationIXPParameters.enableCourses]: z.boolean().nullable().default(false),
  [TalentHubIXPParameters.enableTalentHubV2M2]: z
    .union([z.boolean(), z.number()])
    .nullable()
    .default(false),
  creatorHubSearchIxpParams: z.number().nullable().default(DEFAULT_CREATOR_HUB_SEARCH_VERSION),
});

export type TNavigationIXPResults = z.infer<typeof navigationIXPResultsSchema>;

const navigationConfigsSchema = z.object({
  disableProducts: z.array(z.string()).default([]),
  enableLuobu: z.boolean().default(false),
  enableNotificationsM2: z.boolean().default(false),
  enableAssistant: z.boolean().default(false),
  creatorEventsVariant: z.string().nullable().default(null),
  layoutVariant: z.string().nullable().default(null),
  enableCourses: z.boolean().default(false),
  enableTalentHubV2M2: z.union([z.boolean(), z.number()]).default(false),
  creatorHubSearchIxpParams: z.number().nullable().default(DEFAULT_CREATOR_HUB_SEARCH_VERSION),
});

type TNavigationConfigs = z.infer<typeof navigationConfigsSchema>;

const optionalBooleanSchema = z
  .preprocess((value) => value ?? undefined, z.boolean().optional())
  .catch(undefined);
const optionalNumberSchema = z
  .preprocess((value) => value ?? undefined, z.number().optional())
  .catch(undefined);
const optionalStringSchema = z
  .preprocess((value) => value ?? undefined, z.string().optional())
  .catch(undefined);

const navigationIXPResponseSchema = z
  .object({
    disableProducts: z
      .preprocess((value) => value ?? undefined, z.array(z.string()).optional())
      .catch(undefined),
    enableLuobu: optionalBooleanSchema,
    enableNotificationsM2: optionalBooleanSchema,
    enableAssistant: optionalBooleanSchema,
    creatorEventsVariant: optionalStringSchema,
    layoutVariant: optionalStringSchema,
  })
  .catch({});

const creatorDocumentationIXPResponseSchema = z
  .object({
    enableCourses: optionalBooleanSchema,
  })
  .catch({});

const creatorHubSearchIXPResponseSchema = z
  .object({
    searchVersion: optionalNumberSchema,
  })
  .catch({});

const talentHubIXPResponseSchema = z
  .object({
    enableTalentHubV2M2: z
      .preprocess((value) => value ?? undefined, z.union([z.boolean(), z.number()]).optional())
      .catch(undefined),
  })
  .catch({});

// update storage key everytime we change ixp params setup
export const storageKey = '_navigation';

export const defaultIXPParamsValue = navigationIXPResultsSchema.parse({});

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
  const data: unknown = await response.json();
  return data;
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
      ixpParamsValue: navigationIXPResponseSchema.parse(ixpParams.value),
      ixpParamsByUserValue: navigationIXPResponseSchema.parse(ixpParamsByUser.value),
      ixpParamsByUserIdValue: creatorDocumentationIXPResponseSchema.parse(ixpParamsByUserId.value),
      ixpParamsCreatorHubSearchValue: creatorHubSearchIXPResponseSchema.parse(
        ixpParamsCreatorHubSearchLayer.value,
      ),
      ixpParamsTalentHubValue: talentHubIXPResponseSchema.parse(ixpParamsTalentHubLayer.value),
    };
  }
  return null;
}

async function getNavigationConfigsUncached(
  target: TBuildTarget,
  environment: TTargetEnvironment,
): Promise<TNavigationConfigs | null> {
  const res = await getNavigationIXPParamsUncached(target, environment, NavigationIXPParameters);
  if (res) {
    const {
      ixpParamsValue,
      ixpParamsByUserValue,
      ixpParamsByUserIdValue,
      ixpParamsCreatorHubSearchValue,
      ixpParamsTalentHubValue,
    } = res;

    return navigationConfigsSchema.parse({
      disableProducts: ixpParamsValue.disableProducts ?? ixpParamsByUserValue.disableProducts,
      /* eslint-disable typescript/prefer-nullish-coalescing -- A true value from either IXP layer should enable the feature. */
      enableLuobu: ixpParamsValue.enableLuobu || ixpParamsByUserValue.enableLuobu,
      enableNotificationsM2:
        ixpParamsValue.enableNotificationsM2 || ixpParamsByUserValue.enableNotificationsM2,
      enableAssistant: ixpParamsValue.enableAssistant || ixpParamsByUserValue.enableAssistant,
      /* eslint-enable typescript/prefer-nullish-coalescing */
      creatorEventsVariant:
        ixpParamsValue.creatorEventsVariant ?? ixpParamsByUserValue.creatorEventsVariant,
      layoutVariant: ixpParamsValue.layoutVariant ?? ixpParamsByUserValue.layoutVariant,
      enableCourses: ixpParamsByUserIdValue.enableCourses,
      enableTalentHubV2M2: ixpParamsTalentHubValue.enableTalentHubV2M2,
      creatorHubSearchIxpParams: ixpParamsCreatorHubSearchValue.searchVersion,
    });
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
  void getNavigationConfigsUncached(target, environment).then((result) =>
    localStorageUtils.set(storageKey, result ?? defaultValue),
  );

  return configs;
}
