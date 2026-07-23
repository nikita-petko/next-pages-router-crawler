import { ServerAdSetBrandSuitabilityType } from '@constants/adSet';
import { DeviceType, ServerAgeBucketType, ServerGenderType } from '@constants/advancedTargeting';
import { TargetingCriteriaType } from '@type/advancedTargeting';

export enum ServerAdSetStatusType {
  ENABLED = 2,
  STOPPED = 3,
  ARCHIVED = 4,
  CANCELLED = 5,
}

// https://sourcegraph.rbx.com/github.rbx.com/Roblox/ads@a5bf09d5772f8f23e15c724dca9108596e6ebc93/-/blob/services/ads-management-api/internal/models/ad_set.go?L151:6-151:17
export enum ServerAdSetAuctionType {
  // First price auction
  AUCTION_TYPE_FIRST_PRICE = 1,

  // Second price auction
  AUCTION_TYPE_SECOND_PRICE = 2,

  // Lottery (house ads only)
  AUCTION_TYPE_LOTTERY = 3,

  // Priority (internal accounts only)
  AUCTION_TYPE_FIRST_PRICE_PRIORITY = 4,
}

// https://github.rbx.com/Roblox/ads/blob/46730d7d0d6c47f0ba1c4c9b92c59b51cda5c045/protos/roblox/ads/shared/enums/v3/ad_entity_enums.proto#L83
export enum ServerAdSetBidType {
  // Cost per 1000 impressions.
  CPM = 1,
  // Fixed cost per teleport.
  CPT = 2,
  // Cost per 2s video view
  CPV2 = 3,
  // Cost per 15s video view
  CPV15 = 4,
  // Cost per click
  CPC = 5,
  // Cost per 1000 impressions, for sponsored ads
  CPM_CHARGE = 6,
  UNDEFINED = 'UNDEFINED',
}

// ISO 639-1 standards.
export enum ServerLanguageCode {
  VALUE_UNSPECIFIED = 0,

  // All languages.
  VALUE_ALL = 1,

  // English.
  VALUE_EN = 2,

  // Spanish.
  VALUE_ES = 3,

  // French.
  VALUE_FR = 4,

  // Indonesian.
  VALUE_ID = 5,

  // Italian.
  VALUE_IT = 6,

  // Japanese.
  VALUE_JA = 7,

  // Korean.
  VALUE_KO = 8,

  // Russian.
  VALUE_RU = 9,

  // Thai.
  VALUE_TH = 10,

  // Turkish.
  VALUE_TR = 11,

  // Vietnamese.
  VALUE_VI = 12,

  // Portuguese.
  VALUE_PT = 13,

  // German.
  VALUE_DE = 14,

  // Chinese (Simplified).
  VALUE_ZH_HANS = 15,

  // Chinese (Traditional).
  VALUE_ZH_HANT = 16,

  // Bulgarian.
  VALUE_BG = 17,

  // Bengali.
  VALUE_BN = 18,

  // Czech.
  VALUE_CS = 19,

  // Danish.
  VALUE_DA = 20,

  // Greek.
  VALUE_EL = 21,

  // Estonian.
  VALUE_ET = 22,

  // Finnish.
  VALUE_FI = 23,

  // Hindi.
  VALUE_HI = 24,

  // Croatian.
  VALUE_HR = 25,

  // Hungarian.
  VALUE_HU = 26,

  // Georgian.
  VALUE_KA = 27,

  // Kazakh.
  VALUE_KK = 28,

  // Khmer.
  VALUE_KM = 29,

  // Lithuanian.
  VALUE_LT = 30,

  // Latvian.
  VALUE_LV = 31,

  // Malay.
  VALUE_MS = 32,

  // Burmese.
  VALUE_MY = 33,

  // Bokmal.
  VALUE_NB = 34,

  // Dutch.
  VALUE_NL = 35,

  // Filipino.
  VALUE_FIL = 36,

  // Polish.
  VALUE_PL = 37,

  // Romanian.
  VALUE_RO = 38,

  // Ukrainian.
  VALUE_UK = 39,

  // Sinhala.
  VALUE_SI = 40,

  // Slovak.
  VALUE_SK = 41,

  // Slovenian.
  VALUE_SL = 42,

  // Albanian.
  VALUE_SQ = 43,

  // Bosnian.
  VALUE_BS = 44,

  // Serbian.
  VALUE_SR = 45,

  // Swedish.
  VALUE_SV = 46,

  // Arabic.
  VALUE_AR = 47,
}

interface ServerGetAdSetBiddingStrategyRowResponse {
  bid_type: ServerAdSetBidType;
  bid_value_micro_usd: number;
}

interface ServerGetAdSetRowResponseGenderTargetingCriteria {
  gender: ServerGenderType;
}

interface ServerGetAdSetRowResponseAgeTargetingCriteria {
  all_ages: boolean;
  lower_bound: number;
  upper_bound: number;
}

interface ServerGetAdSetRowResponseAgeBucketTargetingCriteria {
  age_buckets?: ServerAgeBucketType[];
  all_ages: boolean;
}

interface ServerGetAdSetRowResponseDeviceTargetingCriteria {
  devices: DeviceType[];
}

interface ServerGetAdSetRowResponseKeywordTargetingCriteria {
  keywords: string[];
}

interface ServerGetAdSetRowResponseTargetingCriteria {
  age_bucket_criteria: ServerGetAdSetRowResponseAgeBucketTargetingCriteria;
  age_criteria: ServerGetAdSetRowResponseAgeTargetingCriteria;
  device_criteria: ServerGetAdSetRowResponseDeviceTargetingCriteria;
  gender_criteria: ServerGetAdSetRowResponseGenderTargetingCriteria;
  keyword_criteria: ServerGetAdSetRowResponseKeywordTargetingCriteria;
  language_criteria: ServerGetAdSetRowResponseLanguageTargetingCriteria;
}

interface ServerGetAdSetRowResponseFrequencyCappingType {
  value: number;
}

interface ServerGetAdSetRowResponseLanguageTargetingCriteria {
  languages: ServerLanguageCode[];
}

export interface ServerGetAdSetRowResponse {
  auction_type: ServerAdSetAuctionType;
  bidding_strategy: ServerGetAdSetBiddingStrategyRowResponse;
  brand_suitability: ServerAdSetBrandSuitabilityType;
  campaign_id: string;
  created_timestamp_ms: number;
  frequency_capping_rules: ServerGetAdSetRowResponseFrequencyCappingType[];
  id: string;
  name: string;
  // Not implemented yet - empty object
  performance: unknown;
  status: ServerAdSetStatusType;
  targeting_criteria: ServerGetAdSetRowResponseTargetingCriteria;
  updated_timestamp_ms: number;
}

enum AdSetStatusType {
  ARCHIVED = 'ARCHIVED',
  CANCELLED = 'CANCELLED',
  ENABLED = 'ENABLED',
  STOPPED = 'STOPPED',
}

export interface FrequencyCappingType {
  value: number;
}

// https://sourcegraph.rbx.com/github.rbx.com/Roblox/ads@a5bf09d5772f8f23e15c724dca9108596e6ebc93/-/blob/services/ads-management-api/internal/models/ad_set.go?L151:6-151:17
export enum AdSetAuctionType {
  // First price auction
  AUCTION_TYPE_FIRST_PRICE = 'AUCTION_TYPE_FIRST_PRICE',

  // Priority (internal accounts only)
  AUCTION_TYPE_FIRST_PRICE_PRIORITY = 'AUCTION_TYPE_FIRST_PRICE_PRIORITY',

  // Lottery (house ads only)
  AUCTION_TYPE_LOTTERY = 'AUCTION_TYPE_LOTTERY',

  // Second price auction
  AUCTION_TYPE_SECOND_PRICE = 'AUCTION_TYPE_SECOND_PRICE',
}

// https://sourcegraph.rbx.com/github.rbx.com/Roblox/ads/-/blob/services/ads-management-api/internal/models/ad_set.go?L214-228
export enum AdSetBrandSuitabilityType {
  // UNIVERSE_SUITABILITY_FILTER_FULL Deprecated.
  UNIVERSE_SUITABILITY_FILTER_FULL = 'UNIVERSE_SUITABILITY_FILTER_FULL',

  // UNIVERSE_SUITABILITY_FILTER_LIMITED Deprecated.
  UNIVERSE_SUITABILITY_FILTER_LIMITED = 'UNIVERSE_SUITABILITY_FILTER_LIMITED',

  // UNIVERSE_SUITABILITY_FILTER_SELECT Exclusive suitability tier.
  UNIVERSE_SUITABILITY_FILTER_SELECT = 'UNIVERSE_SUITABILITY_FILTER_SELECT',

  // UNIVERSE_SUITABILITY_FILTER_STANDARD Any eligible universe.
  UNIVERSE_SUITABILITY_FILTER_STANDARD = 'UNIVERSE_SUITABILITY_FILTER_STANDARD',

  UNIVERSE_SUITABILITY_FILTER_UNSPECIFIED = 'UNIVERSE_SUITABILITY_FILTER_UNSPECIFIED',
}

export enum AdSetBidType {
  // Cost per 1000 impressions.
  COST_PER_MILLE = 'COST_PER_MILLE',
  // Cost per click
  COST_PER_CLICK = 'CPC',
  // Cost per 15s video view
  CPV15 = 'CPV15',
  // Fixed cost per 1000 impressions
  FIXED_COST_PER_MILLE = 'FIXED_COST_PER_MILLE',
  // Fixed cost per teleport.
  FIXED_COST_PER_TELEPORT = 'FIXED_COST_PER_TELEPORT',
  UNDEFINED = 'UNDEFINED',
}

interface AdSetBaseType {
  auctionType: AdSetAuctionType;
  bidType: AdSetBidType;
  // The value of the bid, in micro-usd (one-millionth of a dollar).
  bidValueMicroUsd: number;
  brandSuitabilityType: AdSetBrandSuitabilityType;
  campaignId: string;
  endTimestampMs?: number;
  frequencyCappingRules: FrequencyCappingType[];
  id: string;
  name: string;
  startTimestampMs: number;
  status: AdSetStatusType;
  targetingRelations: TargetingCriteriaType;
}

export type AdSetCreationType = Omit<AdSetBaseType, 'id'>;

export interface AdSetResponseType extends AdSetBaseType {
  createdAtTimestamp: number;
  updatedAtTimestamp: number;
}
