// Based on AMA AdType: https://sourcegraph.rbx.com/search?q=context:global+repo:%5Egithub%5C.rbx%5C.com/Roblox/ads%24+AdType&patternType=keyword&sm=0
export enum ServerAdType {
  UNSPECIFIED = 0,
  DISPLAY = 1,
  PORTAL = 2,
  VIDEO = 3,
  SPONSORED_UNIVERSE = 4,
  SEARCH = 5,
  VIDEO_2D = 6,
}

// Based on AMA AdStatus: https://sourcegraph.rbx.com/search?q=context:global+repo:%5Egithub%5C.rbx%5C.com/Roblox/ads%24+AdStatus&patternType=keyword&sm=0
export enum ServerAdStatusType {
  UNDEFINED = 0,
  ENABLED = 1,
  STOPPED = 2,
  ARCHIVED = 3,
  CANCELLED = 4,
  DISABLED = 5,
}

// Based on shared enumsv2 AdAssetType: https://sourcegraph.rbx.com/search?q=context:global+repo:%5Egithub%5C.rbx%5C.com/Roblox/ads%24+AdAssetType&patternType=keyword&sm=0
export enum ServerAdAssetType {
  IMAGE = 1,
  VIDEO = 2,
}

// Based on shared enumsv2 AdAssetStatus: https://sourcegraph.rbx.com/search?q=context:global+repo:%5Egithub%5C.rbx%5C.com/Roblox/ads%24+AdAssetStatus&patternType=keyword&sm=0
export enum ServerAdAssetStatusType {
  PENDING_REVIEW = 1,
  APPROVED = 2,
  REJECTED = 3,
}

// Based on shared enumv3 UniverseReviewStatus: https://sourcegraph.rbx.com/search?q=context:global+repo:%5Egithub%5C.rbx%5C.com/Roblox/ads%24+UniverseReviewStatus&patternType=keyword&sm=0
export enum ServerUniverseReviewStatus {
  PENDING_REVIEW = 1,
  APPROVED = 2,
  REJECTED = 3,
}

export enum AdFormatDisplayType {
  AD_FORMAT_DISPLAY = 'AD_FORMAT_DISPLAY',
  AD_FORMAT_PORTAL = 'AD_FORMAT_PORTAL',
  AD_FORMAT_SEARCH = 'AD_FORMAT_SEARCH_AD',
  AD_FORMAT_SPONSORED_UNIVERSE = 'AD_FORMAT_SPONSORED_UNIVERSE',
  AD_FORMAT_UNSPECIFIED = 'AD_FORMAT_UNSPECIFIED',
  AD_FORMAT_VIDEO = 'AD_FORMAT_VIDEO',
}

// Platform constants for ad platform identification
export enum AdPlatform {
  GOOGLE = 'Google',
  META = 'Meta',
  ROBLOX = 'Roblox',
  SNAPCHAT = 'Snapchat',
  TIKTOK = 'TikTok',
}
