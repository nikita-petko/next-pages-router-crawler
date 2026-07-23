import { getProductionCreatorHubUrl, resolveUrl } from '@rbx/env-utils';

export const DEEP_LINKS_URL = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/promotion/deeplinks`;
export const LAUNCH_DATA_LEARN_MORE_URL = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/reference/engine/classes/Player#GetJoinData`;
export const DEVELOPER_PRODUCT_LEARN_MORE_URL = resolveUrl(
  'developerArticleProductsInGamePurchasesUrl',
  process.env.targetEnvironment,
  process.env.buildTarget,
);
export const BADGE_LEARN_MORE_URL = resolveUrl(
  'developerArticleBadgesSpecialGameAwardsUrl',
  process.env.targetEnvironment,
  process.env.buildTarget,
);
export const PASS_LEARN_MORE_URL = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/monetization/game-passes`;
export const PRIVATE_SERVER_LEARN_MORE_URL = resolveUrl(
  'developerArticleCreateVipServerUrl',
  process.env.targetEnvironment,
  process.env.buildTarget,
);
export const RELEASE_EXPERIENCE_TO_PUBLIC_URL = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/publishing/publish-experiences-and-places#release-to-the-public`;
export const AUDIO_ACCESS_PRIVACY = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/building-and-visuals/audio/audio-assets#audio-asset-privacy-system`;
export const ASSET_ACCESS_PRIVACY = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/projects/assets/privacy`;
export const DISTRIBUTE_MODELS = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/parts/models#distribute-models`;
export const SALE_LOCATION_LEARN_MORE_URL = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/art/marketplace/publishing-to-marketplace#sale-location`;
// TODO(nkachkovsky, 08/01/2023): Update VIDEO_ACCESS_PRIVACY link once documentation is created; using generic docs meanwhile
export const VIDEO_ACCESS_PRIVACY = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/projects/assets`;
export const SUBSCRIPTION_LEARN_MORE_URL = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/monetization/subscriptions#creating-subscriptions`;
export const SUBSCRIPTION_LEARN_MORE_PRODUCT_TYPES_URL = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/game-design/subscription-design#bundles`;
export const SUBSCRIPTION_LEARN_MORE_PRICING_URL = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/monetization/subscriptions#earning-with-subscriptions`;
export const ROBLOX_COMMUNITY_STANDARDS = resolveUrl(
  'robloxCommunityStandardsUrl',
  process.env.targetEnvironment,
  process.env.buildTarget,
);
export const MARKETPLACE_POLICY = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/art/marketplace/marketplace-policy#ugc-program-guidelines`;
export const PUBLISHING_ADVANCE = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/art/marketplace/marketplace-fees-and-commissions#publishing-advance`;
export const PRICE_RANGE_LINK = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/en-us/marketplace/publishing-to-marketplace#pricing`;
export const DYNAMIC_FEES_URL = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/en-us/art/marketplace/marketplace-fees-and-commissions#limiteds`;
export const CREATOR_STORE_VERIFICATION_URL = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/publishing/account-verification`;
export const AVATAR_TUTORIALS = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/avatar/tutorials`;
export const CREATOR_REQUIREMENTS = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/art/marketplace/creator-requirements`;
export const GROUP_HOME_URL = `https://www.${process.env.robloxSiteDomain}/groups`;
export const SUBSCRIPTION_TERMS_OF_USE = resolveUrl(
  'ugcSubscriptionTermsOfUseUrl',
  process.env.targetEnvironment,
  process.env.buildTarget,
);
export const ROBLOX_TERMS_OF_USE = resolveUrl(
  'robloxTermsOfUseUrl',
  process.env.targetEnvironment,
  process.env.buildTarget,
);
export const ROBLOX_ADVERTISING_STANDARDS = resolveUrl(
  'advertisingStandardsUrl',
  process.env.targetEnvironment,
  process.env.buildTarget,
);
export const ACCOUNT_VERIFICATION_URL = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/publishing/account-verification`;
export const TOKEN_LEARN_MORE_URL = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/monetization/avatar-creation-token`;
export const MOMENTS_LEARN_MORE_URL =
  'https://about.roblox.com/newsroom/2025/09/roblox-moments-user-generated-discovery';
