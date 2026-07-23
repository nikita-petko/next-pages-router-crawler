import { ServerAdSetBrandSuitabilityType } from '@constants/adSet';
import { ServerAgeBucketType, ServerGenderType } from '@constants/advancedTargeting';
import { CampaignObjectiveType } from '@constants/campaignBuilder';
import { AdFormatType } from '@type/ad';
import {
  FrequencyCappingType,
  ServerAdSetAuctionType,
  ServerAdSetBidType,
  ServerLanguageCode,
} from '@type/adSet';
import { TODOFIXANY } from 'app/shared/types';

export * from '@constants/app';

// https://github.rbx.com/Roblox/ads/blob/bb8e496445f7d470b2315025d72ca1cbab5a9887/protos/roblox/ads/shared/enums/v1/ad_entity_enums.proto
export enum ServerAdStatusType {
  UNDEFINED = 0,
  // An ad that is still pending review.
  ENABLED = 1,
  // An ad that has been stopped and is not being served.
  STOPPED = 2,
  // An ad that has been soft-deleted.
  ARCHIVED = 3,
  // An ad that has been cancelled. The ad is not being served or re-enabled.
  CANCELLED = 4,
}

enum AdStatusType {
  // An ad that has been soft-deleted.
  ARCHIVED = 'ARCHIVED',
  // An ad that has been cancelled. The ad is not being served or re-enabled.
  CANCELLED = 'CANCELLED',
  // An ad that is still pending review.
  ENABLED = 'ENABLED',
  // An ad that has been stopped and is not being served.
  STOPPED = 'STOPPED',
  UNDEFINED = 'UNDEFINED',
}

export enum ServerAdAssetType {
  UNSPECIFIED = 0,
  IMAGE = 1,
  VIDEO = 2,
}

export enum AssetType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export enum ServerAssetType {
  IMAGE = 1,
  ADS_VIDEO = 2,
}

interface AssetBase {
  assetId: string;
  assetType: AssetType;
  height: number;
  width: number;
}

interface Asset extends AssetBase {
  id: string;
}

export type DisplayAdMetadataBase = AssetBase;
type DisplayAdMetadata = Asset;

export interface PortalAdMetadataBase {
  bannerAssetId: string;
  bannerAssetType: AssetType;
  bannerHeight: number;
  bannerWidth: number;
  targetPlaceId: number;
  text?: string;
}

interface PortalAdMetadata extends PortalAdMetadataBase {
  id: string;
}

type AdMetaDataType = DisplayAdMetadata | PortalAdMetadata;

// https://github.rbx.com/Roblox/ads/blob/master/protos/roblox/ads/shared/enums/v3/ad_entity_enums.proto#L116
export enum ServerAdFormatType {
  UNDEFINED = 0,
  DISPLAY = 1,
  PORTAL = 2,
  VIDEO = 3,
  TILE = 4,
  SEARCH = 5,
}

interface AdBaseType {
  adSetId: string;
  adType: AdFormatType;
  campaignId: string;
  id: string;
  metaData: AdMetaDataType;
  name: string;
  status: AdStatusType;
}

export type AdCreationType = Omit<
  AdBaseType,
  'id' | 'status' | 'campaignId' | 'adSetId' | 'metaData'
> & {
  metaData: PortalAdMetadataBase | DisplayAdMetadataBase;
};

export interface Universe {
  // Root place id of the universe
  rootPlaceId: string;

  // ID of the universe
  universeId: string;

  // Name of the universe
  universeName: string;
}

// ISO 3166 country code standards.
enum CountryCode {
  COUNTRY_CODE_ALL = 'COUNTRY_CODE_All',

  // Do not use.
  COUNTRY_CODE_UNDEFINED_INVALID = 'COUNTRY_CODE_UNDEFINED_INVALID',
}

enum RegionCode {
  REGION_CODE_ALL = 'REGION_CODE_All',

  // Do not use.
  COUNTRY_CODE_UNDEFINED_INVALID = 'REGION_CODE_UNDEFINED_INVALID',
}

// ISO 639-1 standards.
enum LanguageCode {
  LANGUAGE_CODE_ALL = 'LANGUAGE_CODE_ALL',

  // Do not use.
  LANGUAGE_CODE_UNDEFINED_INVALID = 'LANGUAGE_CODE_UNDEFINED_INVALID',
}

export enum Gender {
  GENDER_ANY = 'GENDER_ANY',

  GENDER_FEMALE = 'GENDER_FEMALE',

  GENDER_MALE = 'GENDER_MALE',

  // Do not use.
  GENDER_UNDEFINED_INVALID = 'GENDER_UNDEFINED_INVALID',
}

// See: https://github.rbx.com/Roblox/ads/blob/master/protos/roblox/ads/shared/targeting/v2/targeting_criteria.proto#L1137
export enum ServerGenreType {
  // Do not use.
  GENRE_TYPE_UNDEFINED_INVALID = 0,

  // All genres
  GENRE_TYPE_ALL = 1,

  // Action
  GENRE_TYPE_ACTION = 2,

  // Adventure
  GENRE_TYPE_ADVENTURE = 3,

  // Obby
  GENRE_TYPE_OBBY = 5,

  // Puzzle
  GENRE_TYPE_PUZZLE = 6,

  // Roleplaying
  GENRE_TYPE_ROLEPLAYING = 7,

  // Sandbox
  GENRE_TYPE_SANDBOX = 8,

  // Shopping
  GENRE_TYPE_SHOPPING = 9,

  // Simulation
  GENRE_TYPE_SIMULATION = 10,

  // Social Hangout
  GENRE_TYPE_SOCIAL_HANGOUT = 11,

  // Sports
  GENRE_TYPE_SPORTS = 12,

  // Strategy
  GENRE_TYPE_STRATEGY = 13,

  // Tabletop
  GENRE_TYPE_TABLETOP = 14,

  // Tycoon
  GENRE_TYPE_TYCOON = 15,

  // Values of v2 genre taxonomy value below

  // Entertainment
  GENRE_TYPE_ENTERTAINMENT = 16,

  // Roleplay & Avatar Sim
  GENRE_TYPE_ROLEPLAY_AVATAR_SIM = 17,

  // Obby & Platformer
  GENRE_TYPE_OBBY_PLATFORMER = 18,

  // Party & Casual
  GENRE_TYPE_PARTY_CASUAL = 19,

  // RPG
  GENRE_TYPE_RPG = 20,

  // Shooter
  GENRE_TYPE_SHOOTER = 21,

  // Sports & Racing
  GENRE_TYPE_SPORTS_RACING = 22,

  // Survival
  GENRE_TYPE_SURVIVAL = 23,

  // Other
  GENRE_TYPE_OTHER = 24,

  // Action in genre taxonomy v1
  GENRE_TYPE_ACTION_V1 = 25,

  // Adventure in genre taxonomy v1
  GENRE_TYPE_ADVENTURE_V1 = 26,

  // Simulation in genre taxonomy v1
  GENRE_TYPE_SIMULATION_V1 = 27,

  // Strategy in genre taxonomy v1
  GENRE_TYPE_STRATEGY_V1 = 28,
}

interface BiddingStrategyType {
  bid_type: ServerAdSetBidType;
  bid_value_micro_usd: number;
}

interface ServerTargetingCriteriaType {
  age_bucket_criteria?: ServerAgeBucketCriteria;
  age_criteria?: AgeCriteria;
  device_criteria?: ServerDeviceCriteria;
  gender_criteria?: ServerGenderCriteria;
  genre_criteria?: GenreCriteria;
  keyword_criteria?: KeywordCriteria;
  language_criteria?: ServerLanguageCriteria;
  location_criteria?: TODOFIXANY;
}

export interface CreateAdSetRequest {
  auction_type: ServerAdSetAuctionType;
  bidding_strategy: BiddingStrategyType;
  brand_suitability?: ServerAdSetBrandSuitabilityType;
  frequency_capping_rules: FrequencyCappingType[];
  name: string;
  targeting_criteria: ServerTargetingCriteriaType;
}

export enum DeviceType {
  DEVICE_TYPE_ALL = 'DEVICE_TYPE_ALL',

  DEVICE_TYPE_COMPUTER = 'DEVICE_TYPE_COMPUTER',

  DEVICE_TYPE_CONSOLE = 'DEVICE_TYPE_CONSOLE',

  DEVICE_TYPE_PHONE = 'DEVICE_TYPE_PHONE',

  DEVICE_TYPE_TABLET = 'DEVICE_TYPE_TABLET',

  // Do not use.
  DEVICE_TYPE_UNDEFINED_INVALID = 'DEVICE_TYPE_UNDEFINED_INVALID',
}

export enum AgeBucketType {
  AGE_BUCKET_TYPE_5_TO_12 = 'AGE_BUCKET_TYPE_5_TO_12',

  AGE_BUCKET_TYPE_13_TO_17 = 'AGE_BUCKET_TYPE_13_TO_17',

  AGE_BUCKET_TYPE_18_TO_24 = 'AGE_BUCKET_TYPE_18_TO_24',

  AGE_BUCKET_TYPE_25_PLUS = 'AGE_BUCKET_TYPE_25_PLUS',

  AGE_BUCKET_TYPE_ALL = 'AGE_BUCKET_TYPE_ALL',

  // Do not use.
  AGE_BUCKET_TYPE_UNDEFINED_INVALID = 'DEVICE_TYPE_UNDEFINED_INVALID',
}

// Targeting Regions
export interface MixedRegionAndCountryCriteria {
  countries: CountryCode[];
  regions: RegionCode[];
}

// Targeting Languages
export interface LanguageCriteria {
  languages: LanguageCode[];
}

// Server Targeting Languages
interface ServerLanguageCriteria {
  languages: ServerLanguageCode[];
}

// Targeting Gender
export interface GenderCriteria {
  gender: Gender;
}

// Server Targeting Gender
interface ServerGenderCriteria {
  gender?: ServerGenderType;
}

// Targeting age in range
export interface AgeCriteria {
  lowerBound: number;
  upperBound: number;
}

// Targeting age in buckets
export interface AgeBucketCriteria {
  ageBuckets: AgeBucketType[];
}

// Server age bucket targeting
interface ServerAgeBucketCriteria {
  age_buckets?: ServerAgeBucketType[];
  all_ages: boolean;
}

// Targeting devices
export interface DeviceCriteria {
  devices: DeviceType[];
}

// Server Targeting devices
interface ServerDeviceCriteria {
  devices: DeviceType[];
}

export interface GenreCriteria {
  genres: ServerGenreType[];
}

// Server keyword targeting for search ads only
export interface KeywordCriteria {
  keywords: string[];
}

export enum ServerCampaignObjectiveType {
  AWARENESS = 1,
  VISITS = 2,
  VIDEO_VIEWS = 3,
}

enum CampaignStatusType {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  IN_REVIEW = 'IN REVIEW',
  PAUSED = 'PAUSED',
  REJECTED = 'REJECTED',
  SCHEDULED = 'SCHEDULED',
}

export enum BudgetType {
  DAILY = 'DAILY',
  LIFETIME = 'LIFETIME',
}

export enum PaymentMethodType {
  AD_CREDIT = 'AD CREDIT',
  CARD = 'CREDIT CARD',
  INVOICE = 'INVOICE',
}

export interface CampaignBaseType {
  budgetCapMicroUsd: number;
  budgetType: BudgetType;
  campaignEndDate: number;
  campaignEndTime: number;
  campaignStartDate: number;
  campaignStartTime: number;
  endTimestampMs?: number;
  id: string;
  name: string;
  objective: CampaignObjectiveType;
  paymentMethodType: PaymentMethodType;
  startTimestampMs: number;
  status: CampaignStatusType;
}

// https://github.rbx.com/Roblox/ads/blob/cb2b43238d517030b95198498a8d4858170ef94c/protos/roblox/adsmanagementservicev2/adsmanagementservicev2/v1/messages.proto
export enum SummaryEntityType {
  // Campaign.
  ENTITY_TYPE_CAMPAIGN = 1,

  // Ad set.
  ENTITY_TYPE_AD_SET = 2,

  // Ad.
  ENTITY_TYPE_AD = 3,
}

export enum BillableViewDurationType {
  FIFTEEN_SECONDS = 'FIFTEEN_SECONDS',
}
