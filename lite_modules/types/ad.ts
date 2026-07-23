import { AdPolicyReviewLabelType } from '@rbx/ads-moderation-ui';

import {
  ServerAdAssetStatusType,
  ServerAdAssetType,
  ServerAdStatusType,
  ServerAdType,
  ServerUniverseReviewStatus,
} from '@constants/ad';
import { EntityPerformance } from '@type/reportingStats';

// Based on AMS AssetMetadata proto: https://sourcegraph.rbx.com/search?q=context:global+repo:%5Egithub%5C.rbx%5C.com/Roblox/ads%24+AssetMetadata&patternType=keyword&sm=0
interface AssetMetadata {
  asset_id: number;
  asset_status: ServerAdAssetStatusType;
  asset_type: ServerAdAssetType;
  height: number;
  width: number;
}

// Based on AMS SponsoredUniverseAdMetadata proto: https://sourcegraph.rbx.com/search?q=context:global+repo:%5Egithub%5C.rbx%5C.com/Roblox/ads%24+SponsoredUniverseAdMetadata&patternType=keyword&sm=0
interface SponsoredUniverseAdMetadata {
  asset_metadata: AssetMetadata;
  /** Reach home-feed copy; returned on native date-filtered sponsored-universe ads. */
  headline?: string;
  is_target_universe_paid_at_ad_creation: boolean;
  logo_asset_aspect_width?: number;
  logo_asset_id?: number;
  subtitle?: string;
  target_universe_id: number;
  universe_review_status: ServerUniverseReviewStatus;
}

// Based on AMA Ad: https://sourcegraph.rbx.com/search?q=context:global+repo:%5Egithub%5C.rbx%5C.com/Roblox/ads%24+file:%5Eservices/ads-management-api/+Ad&patternType=keyword&sm=0
export interface Ad {
  ad_policy_review_label: AdPolicyReviewLabelType;
  ad_policy_review_updated_timestamp_ms: number;
  ad_set_id: string;
  campaign_id: string;
  composite_review_decision: ServerAdAssetCompositeReviewDecisionType;
  // When other ad formats added, make this optional
  created_timestamp_ms: number;
  /**
   * Optional Reach creative fields when the native date-filter API returns them at the ad root
   * instead of under `sponsored_universe_ad_metadata`.
   */
  headline?: string;
  id: string;
  logo_asset_aspect_width?: number;
  logo_asset_id?: number;
  name: string;
  performance?: EntityPerformance;
  platform?: string;
  sponsored_universe_ad_metadata: SponsoredUniverseAdMetadata;
  status: ServerAdStatusType;
  subtitle?: string;
  type: ServerAdType;
  updated_timestamp_ms: number;
}

export interface ListAdsResponseType {
  ads?: Ad[];
  next_cursor?: string;
}

export enum AdFormatType {
  DISPLAY = 'DISPLAY',
  PORTAL = 'PORTAL',
  SEARCH = 'SEARCH',
  TILE = 'TILE',
  UNDEFINED = 'UNDEFINED',
  VIDEO = 'VIDEO',
}

export enum ServerAdAssetCompositeReviewDecisionType {
  // UNSPECIFIED value.
  UNSPECIFIED = 0,

  // An asset that is still pending review.
  // Not eligible to be served.
  PENDING_REVIEW = 1,

  // An asset that has been approved.
  // Eligible to be served.
  APPROVED = 2,

  // An asset that has been rejected.
  // Not eligible to be served.
  REJECTED = 3,
}

interface ServerGetAdRowResponseDisplayAdAssetMetadata {
  asset_id: string;
  asset_status: ServerAdAssetCompositeReviewDecisionType;
  asset_type: ServerAdAssetType;
  height: number;
  width: number;
}

interface ServerGetAdRowResponseDisplayAdMetadata {
  asset_metadata: ServerGetAdRowResponseDisplayAdAssetMetadata;
}

interface ServerGetAdRowResponsePortalAdAssetMetadata {
  asset_id: string;
  asset_status: ServerAdAssetCompositeReviewDecisionType;
  asset_type: ServerAdAssetType;
  height: number;
  width: number;
}

interface ServerGetAdRowResponsePortalAdMetadata {
  banner_asset_metadata: ServerGetAdRowResponsePortalAdAssetMetadata;
  target_place_id: number;
  text: string;
}

// https://github.rbx.com/Roblox/ads/blob/master/protos/roblox/ads/shared/enums/v3/ad_entity_enums.proto#L412-L427
enum ServerSponsoredAdUniverseReviewStatus {
  // UNSPECIFIED value.
  UNSPECIFIED = 0,

  // An universe that is still pending review.
  // Not eligible to be served.
  PENDING_REVIEW = 1,

  // An universe that has been approved.
  // Eligible to be served.
  APPROVED = 2,

  // An universe that has been rejected.
  // Not eligible to be served.
  REJECTED = 3,
}

interface ServerGetAdRowResponseSponsoredUniverseAdMetadata {
  target_universe_id: number;
  universe_review_status: ServerSponsoredAdUniverseReviewStatus;
}

interface ServerGetAdRowResponseSearchAdMetadata {
  target_universe_id: number;
  universe_review_status: ServerSponsoredAdUniverseReviewStatus;
}

export interface ServerGetAdRowResponse {
  ad_set_id: string;
  campaign_id: string;
  composite_review_decision: ServerAdAssetCompositeReviewDecisionType;
  created_timestamp_ms: number;
  display_ad_metadata: ServerGetAdRowResponseDisplayAdMetadata;
  id: string;
  name: string;
  portal_ad_metadata: ServerGetAdRowResponsePortalAdMetadata;
  search_ad_metadata: ServerGetAdRowResponseSearchAdMetadata;
  sponsored_universe_ad_metadata: ServerGetAdRowResponseSponsoredUniverseAdMetadata;
  status: ServerAdStatusType;
  type: ServerAdType;
  updated_timestamp_ms: number;
}
