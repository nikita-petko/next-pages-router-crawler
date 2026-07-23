import { ServerCampaignObjectiveType, ServerDetailedTargetingMatchType } from '@constants/campaign';
import { ServerAdSetBidType } from '@type/adSet';

export enum FormField {
  BID_TYPE = 'bidType',
  BID_VALUE = 'bidValue',
  BUDGET = 'budget',
  BUDGET_TYPE = 'budgetType',
  CAMPAIGN_NAME = 'campaignName',
  CLICK_DESTINATION = 'clickDestination',
  CREATIVE_FORMAT = 'creativeFormat',
  CUSTOM_BUDGET = 'customBudget',
  CUSTOM_DURATION = 'customDuration',
  DETAILED_TARGETING_MATCH_TYPE = 'detailedTargetingMatchType',
  DISCOUNT = 'discount',
  DURATION = 'duration',
  END_DATE = 'endDate',
  END_TIME = 'endTime',
  EXPERIENCE = 'experience',
  FREQUENCY_CAPPING_DURATION_DAYS = 'frequencyCappingDurationDays',
  FREQUENCY_CAPPING_ON = 'frequencyCappingOn',
  FREQUENCY_CAPPING_VALUE = 'frequencyCappingValue',
  GOAL = 'goal',
  HEADLINE = 'headline',
  IDEMPOTENCY_KEY = 'idempotencyKey',
  IS_AUTO_RELOAD_ENABLED = 'isAutoReloadEnabled',
  IS_EXTEND_TO_OFF_PLATFORM_ENABLED = 'isExtendToOffPlatformEnabled',
  LAUNCH_DATA = 'launchData',
  LOGO_ASSETS = 'logoAsset',
  PAYMENT_TYPE = 'paymentType',
  PLACE_ID_OVERRIDE = 'placeIdOverride',
  START_DATE = 'startDate',
  START_TIME = 'startTime',
  SUBTITLE = 'subtitle',
  THUMBNAILS = 'thumbnails',
  VIDEOS = 'videos',
}

export const TimeFormat = 'hh:mm A';
export const DateFormat = 'll';

export enum FlowTypes {
  CLONE = 'clone',
  CREATE = 'create',
  EDIT = 'edit',
}

export const AllCampaignObjectives = [
  ServerCampaignObjectiveType.VISITS,
  ServerCampaignObjectiveType.RETENTION,
  ServerCampaignObjectiveType.REACTIVATION,
  ServerCampaignObjectiveType.SPEND,
];

export const AllDetailedTargetingMatchTypes = [
  ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_UNSPECIFIED,
  ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_REACTIVATION,
  ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_RETENTION,
  ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_ACQUIRE_NEW_USERS,
];

export const DefaultDuration = 7;
export const DefaultBudget = 8000000;

export const CONTINUOUS_VALUE = 'continuous';
export const SERVER_CONTINUOUS_VALUE = 0;

export const ThumbnailSize = {
  height: 90,
  width: 160,
};

export const LogoSize = {
  height: 90,
  width: 90,
};

export const MAX_ALLOWED_CREATIVES = 5; // TODO: fetch from metadata
export const MAX_DISPLAYABLE_ADS = 100;
export const UPLOAD_BUFFER_COUNT = 10; // We allow a buffer of uploads above the max allowed creatives to account for failed uploads and deletions
// Reach campaigns allow exactly one selected logo at a time. Lives here
// (vs. the drawer content file) so the reach creative section can render a
// matching "(selected/max)" count next to the logo header without
// duplicating the literal 1.
export const MAX_LOGO_SELECTIONS = 1;

export enum AssetSource {
  ADS_MANAGER = 'AdsManager',
  CREATOR = 'Creator',
}

export const CreativeMarketingBlurb = 'Description.CreativeMarketingBlurb';

export const warningUniverseId = 0;

export const noExperiencesOption = {
  universe_id: warningUniverseId,
  universe_name: 'Description.NoExperiencesFound',
};

export const experienceNotFoundOption = {
  universe_id: warningUniverseId,
  universe_name: 'Description.ExperienceNotFound',
};

export const NO_PAYMENT_METHOD_COPY = 'Description.NoPaymentMethod';
export const FAILED_TO_FETCH_PAYMENT_METHOD_COPY = 'Description.FailedToFetchPayment';

export const HIGH_BUDGET_WARNING_TEXT = 'Description.HighBudgetWarning';

export const DefaultTimeZone = {
  cityKey: 'Label.TimezoneCity.AmericaLosAngeles',
  timezoneDbName: 'America/Los_Angeles',
  title: '(GMT -08:00) Los Angeles Time',
  value: 148,
};

export const DEFAULT_RECOMMENDATION_RESPONSE = {
  budget_options_by_audience_in_micro_usd: {
    2: [
      {
        is_recommended: false,
        value: 6000000,
      },
      {
        is_recommended: true,
        value: 8000000,
      },
      {
        is_recommended: false,
        value: 10000000,
      },
    ],
    4: [
      {
        is_recommended: false,
        value: 6000000,
      },
      {
        is_recommended: true,
        value: 8000000,
      },
      {
        is_recommended: false,
        value: 10000000,
      },
    ],
    5: [
      {
        is_recommended: false,
        value: 6000000,
      },
      {
        is_recommended: true,
        value: 8000000,
      },
      {
        is_recommended: false,
        value: 10000000,
      },
    ],
  },
  duration_options_in_days: [
    {
      is_recommended: true,
      value: 0,
    },
    {
      is_recommended: false,
      value: 5,
    },
    {
      is_recommended: false,
      value: 7,
    },
    {
      is_recommended: false,
      value: 10,
    },
  ],
};

export enum CampaignObjectiveType {
  AWARENESS = 'AWARENESS',
  VIDEO_VIEWS = 'VIDEO_VIEWS',
  VISITS = 'VISITS',
}

// Common MUI props for form fields to fix z-index issues
export const FORM_HELPER_TEXT_PROPS = {
  sx: {
    zIndex: 0,
  },
};

export const INPUT_LABEL_PROPS = {
  sx: {
    zIndex: 0,
  },
};

export const DEFAULT_REACH_BID_VALUE = 10;
export const DEFAULT_REACH_FREQUENCY_CAPPING_VALUE = 2;
export const DEFAULT_REACH_FREQUENCY_CAPPING_DURATION_DAYS = 1;
export const DEFAULT_REACH_BID_DISCOUNT_BPS = 0;

// Max Reach creative format. The 2x1 horizontal card is an image ad; the 1x2
// vertical card is a video ad. The server derives the tile dimensions from the
// sponsored ad's asset type, so this only drives the UI (format selector,
// video slot, bid-type options, and fcap copy).
export enum ReachAdFormat {
  VERTICAL_1X2 = '1x2',
  HORIZONTAL_2X1 = '2x1',
}

export const DEFAULT_REACH_AD_FORMAT = ReachAdFormat.HORIZONTAL_2X1;
export const DEFAULT_REACH_BID_TYPE = ServerAdSetBidType.CPM_CHARGE;

// Bid types offered per Max Reach format. 2x1 (image) only supports CPM;
// 1x2 (video) additionally supports CPV2 (cost per 2-second video view).
export const REACH_BID_TYPE_OPTIONS_BY_FORMAT: Record<ReachAdFormat, ServerAdSetBidType[]> = {
  [ReachAdFormat.HORIZONTAL_2X1]: [ServerAdSetBidType.CPM_CHARGE],
  [ReachAdFormat.VERTICAL_1X2]: [ServerAdSetBidType.CPM_CHARGE, ServerAdSetBidType.CPV2],
};

export const DEFAULT_HEADLINE_MAX_LENGTH = 22;
export const DEFAULT_SUBTITLE_MAX_LENGTH = 32;

// Shown on the reach creative preview tile when the age recommendation
// (maturity) can't be fetched from experience-guidelines-api.
export const MATURITY_PLACEHOLDER = 'Maturity: Placeholder';
