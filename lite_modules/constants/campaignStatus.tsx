import { ReactNode } from 'react';

import { LinkTag } from '@type/translation';
import { GetSitetestBaseUrl } from '@utils/url';

// Text after the new line is purely to differentiate the string values
// Only text before the new line will be displayed to the user
export const enum StatusText {
  DISPLAY_STATUS_ACTIVE = 'Status.Active',
  DISPLAY_STATUS_AUTO_COMPLETED = 'Status.AutoCompleted',
  DISPLAY_STATUS_AUTO_PAUSED = 'Status.AutoPaused',
  DISPLAY_STATUS_CANCELED = 'Status.Canceled',
  DISPLAY_STATUS_PARENT_CAMPAIGN_IS_CANCELED = 'Status.CanceledCampaignCanceled',
  DISPLAY_STATUS_COMPLETED = 'Status.Completed',
  DISPLAY_STATUS_ERROR = 'Status.Error',
  DISPLAY_STATUS_INACTIVE = 'Status.Inactive',
  DISPLAY_STATUS_MODERATED_INACTIVE = 'Status.InactiveModerated',
  DISPLAY_STATUS_PLACE_JOIN_RESTRICTED = 'Status.InactivePlaceJoinRestricted',
  DISPLAY_STATUS_PRIVATE = 'Status.InactiveUniversePrivate',
  DISPLAY_STATUS_IN_REVIEW = 'Status.InReview',
  DISPLAY_STATUS_INVALID = 'Status.Invalid',
  DISPLAY_STATUS_LEARNING = 'Status.Learning',
  DISPLAY_STATUS_LOADING = 'Status.Loading',
  DISPLAY_STATUS_MODERATED_ACTIVE = 'Status.Moderated',
  DISPLAY_STATUS_PAUSED = 'Status.Paused',
  DISPLAY_STATUS_PARENT_AD_SET_IS_PAUSED = 'Status.PausedAdSetPaused',
  DISPLAY_STATUS_PARENT_CAMPAIGN_IS_PAUSED = 'Status.PausedCampaignPaused',
  DISPLAY_STATUS_PROCESSING = 'Status.Processing',
  DISPLAY_STATUS_REJECTED = 'Status.Rejected',
  DISPLAY_STATUS_CLICKBAIT = 'Status.RejectedTooSimilar',
  DISPLAY_STATUS_GAME_FILTERED = 'Status.RejectedUniverseModerated',
  DISPLAY_STATUS_SCHEDULED = 'Status.Scheduled',
}

export const StatusRankings: StatusText[][] = [
  [StatusText.DISPLAY_STATUS_IN_REVIEW],
  [StatusText.DISPLAY_STATUS_MODERATED_ACTIVE],
  [StatusText.DISPLAY_STATUS_MODERATED_INACTIVE],
  [StatusText.DISPLAY_STATUS_CLICKBAIT],
  [StatusText.DISPLAY_STATUS_GAME_FILTERED],
  [StatusText.DISPLAY_STATUS_LEARNING],
  [StatusText.DISPLAY_STATUS_ACTIVE],
  [StatusText.DISPLAY_STATUS_SCHEDULED],
  [StatusText.DISPLAY_STATUS_AUTO_PAUSED],
  [StatusText.DISPLAY_STATUS_PAUSED],
  [StatusText.DISPLAY_STATUS_PARENT_AD_SET_IS_PAUSED],
  [StatusText.DISPLAY_STATUS_PARENT_CAMPAIGN_IS_PAUSED],
  [StatusText.DISPLAY_STATUS_PRIVATE],
  [StatusText.DISPLAY_STATUS_PLACE_JOIN_RESTRICTED],
  [StatusText.DISPLAY_STATUS_INACTIVE],
  [StatusText.DISPLAY_STATUS_PROCESSING],
  [StatusText.DISPLAY_STATUS_REJECTED],
  [StatusText.DISPLAY_STATUS_ERROR],
  [StatusText.DISPLAY_STATUS_COMPLETED, StatusText.DISPLAY_STATUS_AUTO_COMPLETED],
  [StatusText.DISPLAY_STATUS_CANCELED, StatusText.DISPLAY_STATUS_PARENT_CAMPAIGN_IS_CANCELED],
];

export const statusTextToTooltipKey = new Map<StatusText, string>([
  [StatusText.DISPLAY_STATUS_PARENT_CAMPAIGN_IS_PAUSED, 'Description.CampaignIsPaused'],
  [StatusText.DISPLAY_STATUS_PARENT_AD_SET_IS_PAUSED, 'Description.AdSetIsPaused'],
  [StatusText.DISPLAY_STATUS_PARENT_CAMPAIGN_IS_CANCELED, 'Description.CampaignIsCanceled'],
  [StatusText.DISPLAY_STATUS_PROCESSING, 'Description.UnspentAdCreditRefunded'],
  [StatusText.DISPLAY_STATUS_AUTO_COMPLETED, 'Description.CampaignAutoCompleted'],
  [StatusText.DISPLAY_STATUS_LEARNING, 'Description.CampaignLearningPhase'],
  [StatusText.DISPLAY_STATUS_CLICKBAIT, 'Description.CampaignCannotServeModerated'],
  [StatusText.DISPLAY_STATUS_GAME_FILTERED, 'Description.CampaignCannotServeSuspended'],
  [StatusText.DISPLAY_STATUS_PRIVATE, 'Description.ExperienceSetToPrivate'],
  [StatusText.DISPLAY_STATUS_PLACE_JOIN_RESTRICTED, 'Description.PlaceJoinRestricted'],
]);

const statusTextToTooltipLinkUrl = new Map<StatusText, (universeId?: number) => string>([
  [
    StatusText.DISPLAY_STATUS_CLICKBAIT,
    () => `https://create.${GetSitetestBaseUrl()}/docs/discovery#best-practices-for-discovery`,
  ],
  [
    StatusText.DISPLAY_STATUS_PLACE_JOIN_RESTRICTED,
    (universeId?: number) =>
      universeId
        ? `https://create.${GetSitetestBaseUrl()}/dashboard/creations/experiences/${universeId}/places`
        : `https://create.${GetSitetestBaseUrl()}/dashboard/creations`,
  ],
]);

export const getStatusTooltipLinkTags = (
  status: StatusText,
  universeId?: number,
): LinkTag[] | null => {
  const getUrl = statusTextToTooltipLinkUrl.get(status);
  if (!getUrl) {
    return null;
  }
  return [
    {
      closing: 'linkEnd',
      content: (chunks: ReactNode) => (
        <a
          href={getUrl(universeId)}
          rel='noopener noreferrer'
          // eslint-disable-next-line no-inline-styles/no-inline-styles
          style={{ color: 'inherit', textDecoration: 'underline' }}
          target='_blank'>
          {chunks}
        </a>
      ),
      opening: 'linkStart',
    },
  ];
};

// https://github.rbx.com/Roblox/ads/blob/master/services/ads-management-api/internal/models/get_campaign_status_response.go#L9-L31
// sourcegraph search if it changes location: https://sourcegraph.rbx.com/search?q=context%3Aglobal+repo%3A%5Egithub%5C.rbx%5C.com%2FRoblox%2Fads%24+CampaignDisplayStatus&patternType=standard&sm=1&groupBy=path
export enum CampaignDisplayStatusType {
  CAMPAIGN_DISPLAY_STATUS_UNSPECIFIED = 0,

  CAMPAIGN_DISPLAY_STATUS_PAUSED = 1,

  CAMPAIGN_DISPLAY_STATUS_SCHEDULED = 2,

  CAMPAIGN_DISPLAY_STATUS_INACTIVE = 3,

  CAMPAIGN_DISPLAY_STATUS_ERROR = 4,

  CAMPAIGN_DISPLAY_STATUS_COMPLETED = 5,

  CAMPAIGN_DISPLAY_STATUS_IN_REVIEW = 6,

  CAMPAIGN_DISPLAY_STATUS_CANCELED = 7,

  CAMPAIGN_DISPLAY_STATUS_PROCESSING = 8,

  CAMPAIGN_DISPLAY_STATUS_ACTIVE = 9,

  CAMPAIGN_DISPLAY_STATUS_AUTO_PAUSED = 10,

  CAMPAIGN_DISPLAY_STATUS_EXPIRED = 11,

  CAMPAIGN_DISPLAY_STATUS_MODERATED_INACTIVE = 12,

  CAMPAIGN_DISPLAY_STATUS_MODERATED_ACTIVE = 13,

  CAMPAIGN_DISPLAY_STATUS_LEARNING = 14,

  CAMPAIGN_DISPLAY_STATUS_CLICKBAIT = 15,

  CAMPAIGN_DISPLAY_STATUS_GAME_FILTERED = 16,

  CAMPAIGN_DISPLAY_STATUS_PRIVATE = 17,

  CAMPAIGN_DISPLAY_STATUS_PLACE_JOIN_RESTRICTED = 18,
}

export const backendToFrontendCampaignStatus = new Map([
  [CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_PAUSED, StatusText.DISPLAY_STATUS_PAUSED],
  [
    CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_SCHEDULED,
    StatusText.DISPLAY_STATUS_SCHEDULED,
  ],
  [CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_INACTIVE, StatusText.DISPLAY_STATUS_INACTIVE],
  [CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_ERROR, StatusText.DISPLAY_STATUS_ERROR],
  [
    CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_COMPLETED,
    StatusText.DISPLAY_STATUS_COMPLETED,
  ],
  [
    CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_IN_REVIEW,
    StatusText.DISPLAY_STATUS_IN_REVIEW,
  ],
  [CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_CANCELED, StatusText.DISPLAY_STATUS_CANCELED],
  [
    CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_PROCESSING,
    StatusText.DISPLAY_STATUS_PROCESSING,
  ],
  [CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_ACTIVE, StatusText.DISPLAY_STATUS_ACTIVE],
  [
    CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_AUTO_PAUSED,
    StatusText.DISPLAY_STATUS_AUTO_PAUSED,
  ],
  [
    CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_EXPIRED,
    StatusText.DISPLAY_STATUS_AUTO_COMPLETED,
  ],
  [
    CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_MODERATED_INACTIVE,
    StatusText.DISPLAY_STATUS_MODERATED_INACTIVE,
  ],
  [
    CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_MODERATED_ACTIVE,
    StatusText.DISPLAY_STATUS_MODERATED_ACTIVE,
  ],
  [CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_LEARNING, StatusText.DISPLAY_STATUS_LEARNING],
  [
    CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_CLICKBAIT,
    StatusText.DISPLAY_STATUS_CLICKBAIT,
  ],
  [
    CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_GAME_FILTERED,
    StatusText.DISPLAY_STATUS_GAME_FILTERED,
  ],
  [CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_PRIVATE, StatusText.DISPLAY_STATUS_PRIVATE],
  [
    CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_PLACE_JOIN_RESTRICTED,
    StatusText.DISPLAY_STATUS_PLACE_JOIN_RESTRICTED,
  ],
]);

export enum AdSetDisplayStatusType {
  AD_SET_DISPLAY_STATUS_UNSPECIFIED = 0,
  AD_SET_DISPLAY_STATUS_ACTIVE = 1,
  AD_SET_DISPLAY_STATUS_SCHEDULED = 2,
  AD_SET_DISPLAY_STATUS_PAUSED = 3,
  AD_SET_DISPLAY_STATUS_INACTIVE = 4,
  AD_SET_DISPLAY_STATUS_PARENT_CAMPAIGN_IS_PAUSED = 5,
  AD_SET_DISPLAY_STATUS_COMPLETED = 6,
  AD_SET_DISPLAY_STATUS_ERROR = 7,
  AD_SET_DISPLAY_STATUS_IN_REVIEW = 8,
  AD_SET_DISPLAY_STATUS_PARENT_CAMPAIGN_IS_CANCELED = 9,
}

export const backendToFrontendAdSetStatus = new Map([
  [AdSetDisplayStatusType.AD_SET_DISPLAY_STATUS_ACTIVE, StatusText.DISPLAY_STATUS_ACTIVE],
  [AdSetDisplayStatusType.AD_SET_DISPLAY_STATUS_SCHEDULED, StatusText.DISPLAY_STATUS_SCHEDULED],
  [AdSetDisplayStatusType.AD_SET_DISPLAY_STATUS_PAUSED, StatusText.DISPLAY_STATUS_PAUSED],
  [AdSetDisplayStatusType.AD_SET_DISPLAY_STATUS_INACTIVE, StatusText.DISPLAY_STATUS_INACTIVE],
  [
    AdSetDisplayStatusType.AD_SET_DISPLAY_STATUS_PARENT_CAMPAIGN_IS_PAUSED,
    StatusText.DISPLAY_STATUS_PARENT_CAMPAIGN_IS_PAUSED,
  ],
  [AdSetDisplayStatusType.AD_SET_DISPLAY_STATUS_COMPLETED, StatusText.DISPLAY_STATUS_COMPLETED],
  [AdSetDisplayStatusType.AD_SET_DISPLAY_STATUS_ERROR, StatusText.DISPLAY_STATUS_ERROR],
  [AdSetDisplayStatusType.AD_SET_DISPLAY_STATUS_IN_REVIEW, StatusText.DISPLAY_STATUS_IN_REVIEW],
  [
    AdSetDisplayStatusType.AD_SET_DISPLAY_STATUS_PARENT_CAMPAIGN_IS_CANCELED,
    StatusText.DISPLAY_STATUS_PARENT_CAMPAIGN_IS_CANCELED,
  ],
]);

export enum AdDisplayStatusType {
  AD_DISPLAY_STATUS_UNSPECIFIED = 0,
  AD_DISPLAY_STATUS_ACTIVE = 1,
  AD_DISPLAY_STATUS_REJECTED = 2,
  AD_DISPLAY_STATUS_IN_REVIEW = 3,
  AD_DISPLAY_STATUS_PAUSED = 4,
  AD_DISPLAY_STATUS_PARENT_AD_SET_IS_PAUSED = 5,
  AD_DISPLAY_STATUS_PARENT_CAMPAIGN_IS_PAUSED = 6,
  AD_DISPLAY_STATUS_COMPLETED = 7,
  AD_DISPLAY_STATUS_SCHEDULED = 8,
  AD_DISPLAY_STATUS_ERROR = 9,
  AD_DISPLAY_STATUS_PARENT_CAMPAIGN_IS_CANCELED = 10,
  AD_DISPLAY_STATUS_CLICKBAIT = 11,
  AD_DISPLAY_STATUS_GAME_FILTERED = 12,
  AD_DISPLAY_STATUS_PRIVATE = 13,
  AD_DISPLAY_STATUS_PARENT_CAMPAIGN_IS_LEARNING = 14,
  AD_DISPLAY_STATUS_PLACE_JOIN_RESTRICTED = 15,
}

export const backendToFrontendAdStatus = new Map([
  [AdDisplayStatusType.AD_DISPLAY_STATUS_ACTIVE, StatusText.DISPLAY_STATUS_ACTIVE],
  [AdDisplayStatusType.AD_DISPLAY_STATUS_REJECTED, StatusText.DISPLAY_STATUS_REJECTED],
  [AdDisplayStatusType.AD_DISPLAY_STATUS_IN_REVIEW, StatusText.DISPLAY_STATUS_IN_REVIEW],
  [AdDisplayStatusType.AD_DISPLAY_STATUS_PAUSED, StatusText.DISPLAY_STATUS_PAUSED],
  [
    AdDisplayStatusType.AD_DISPLAY_STATUS_PARENT_AD_SET_IS_PAUSED,
    StatusText.DISPLAY_STATUS_PARENT_AD_SET_IS_PAUSED,
  ],
  [
    AdDisplayStatusType.AD_DISPLAY_STATUS_PARENT_CAMPAIGN_IS_PAUSED,
    StatusText.DISPLAY_STATUS_PARENT_CAMPAIGN_IS_PAUSED,
  ],
  [AdDisplayStatusType.AD_DISPLAY_STATUS_COMPLETED, StatusText.DISPLAY_STATUS_COMPLETED],
  [AdDisplayStatusType.AD_DISPLAY_STATUS_SCHEDULED, StatusText.DISPLAY_STATUS_SCHEDULED],
  [AdDisplayStatusType.AD_DISPLAY_STATUS_ERROR, StatusText.DISPLAY_STATUS_ERROR],
  [
    AdDisplayStatusType.AD_DISPLAY_STATUS_PARENT_CAMPAIGN_IS_CANCELED,
    StatusText.DISPLAY_STATUS_PARENT_CAMPAIGN_IS_CANCELED,
  ],
  [AdDisplayStatusType.AD_DISPLAY_STATUS_CLICKBAIT, StatusText.DISPLAY_STATUS_CLICKBAIT],
  [AdDisplayStatusType.AD_DISPLAY_STATUS_GAME_FILTERED, StatusText.DISPLAY_STATUS_GAME_FILTERED],
  [AdDisplayStatusType.AD_DISPLAY_STATUS_PRIVATE, StatusText.DISPLAY_STATUS_PRIVATE],
  [
    AdDisplayStatusType.AD_DISPLAY_STATUS_PARENT_CAMPAIGN_IS_LEARNING,
    StatusText.DISPLAY_STATUS_LEARNING,
  ],
  [
    AdDisplayStatusType.AD_DISPLAY_STATUS_PLACE_JOIN_RESTRICTED,
    StatusText.DISPLAY_STATUS_PLACE_JOIN_RESTRICTED,
  ],
]);
