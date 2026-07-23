import { ServerAdStatusType } from '@constants/ad';
import {
  AdDisplayStatusType,
  backendToFrontendAdSetStatus,
  backendToFrontendAdStatus,
  backendToFrontendCampaignStatus,
  CampaignDisplayStatusType,
  StatusRankings,
  StatusText,
} from '@constants/campaignStatus';
import { Ad } from '@type/ad';
import {
  GetAdSetStatusResponseType,
  GetAdStatusResponseType,
  GetCampaignStatusResponseType,
} from '@type/campaign';
import { IsOffPlatformAd } from '@utils/offPlatformAdUtils';

// This is used to sort the table by status
const tableOrderByDisplayStatus: { [key in StatusText | string]?: string | undefined } = {};
StatusRankings.forEach((statuses, index) => {
  if (index > 111 - '0'.charCodeAt(0)) {
    throw new Error('Array cannot exceed 111 items to compute rankings');
  }
  statuses.forEach((status) => {
    tableOrderByDisplayStatus[status] = String.fromCharCode(111 - index); // Calculate letter based on index
  });
});

// GetTableDisplayOrderByStatus returns the weight that is used to sort the table by status
// https://roblox.slack.com/archives/C05ENB54Y0M/p1701731372738989?thread_ts=1701711042.801749&cid=C05ENB54Y0M
export const GetTableDisplayOrderByStatus = (statusText: StatusText | string): string =>
  tableOrderByDisplayStatus[statusText] || `0-${statusText}`; // Default case for unrecognized statuses

export const GetCampaignStatusText = (status?: CampaignDisplayStatusType) => {
  if (status) {
    return backendToFrontendCampaignStatus.get(status) || StatusText.DISPLAY_STATUS_INVALID;
  }
  return StatusText.DISPLAY_STATUS_LOADING;
};

export const GetBackendCampaignStatusText = (
  backendStatuses: Map<string, GetCampaignStatusResponseType>,
  key: string,
) => {
  const status = backendStatuses.get(key)?.display_status;
  return GetCampaignStatusText(status);
};

export const GetBackendAdSetStatusText = (
  backendStatuses: Map<string, GetAdSetStatusResponseType>,
  key: string,
) => {
  const status = backendStatuses.get(key)?.display_status;
  if (status) {
    return backendToFrontendAdSetStatus.get(status) || StatusText.DISPLAY_STATUS_INVALID;
  }
  return StatusText.DISPLAY_STATUS_LOADING;
};

/**
 * Converts server ad status to display status for off-platform ads
 * @param serverStatus The server ad status
 * @returns The corresponding display status
 */
export const ConvertServerAdStatusToDisplayStatus = (
  serverStatus: ServerAdStatusType,
): AdDisplayStatusType => {
  switch (serverStatus) {
    case ServerAdStatusType.ENABLED:
      return AdDisplayStatusType.AD_DISPLAY_STATUS_ACTIVE;
    case ServerAdStatusType.STOPPED:
      return AdDisplayStatusType.AD_DISPLAY_STATUS_PAUSED;
    case ServerAdStatusType.CANCELLED:
      return AdDisplayStatusType.AD_DISPLAY_STATUS_PARENT_CAMPAIGN_IS_CANCELED;
    case ServerAdStatusType.ARCHIVED:
      return AdDisplayStatusType.AD_DISPLAY_STATUS_COMPLETED;
    default:
      return AdDisplayStatusType.AD_DISPLAY_STATUS_ERROR;
  }
};

const GetAdStatusText = (status?: AdDisplayStatusType) => {
  if (status) {
    return backendToFrontendAdStatus.get(status) || StatusText.DISPLAY_STATUS_INVALID;
  }
  return StatusText.DISPLAY_STATUS_LOADING;
};

export const GetBackendAdStatusText = (
  backendStatuses: Map<string, GetAdStatusResponseType>,
  key: string,
) => {
  const status = backendStatuses.get(key)?.display_status;
  return GetAdStatusText(status);
};

/**
 * Gets the status text for an ad, handling both on-platform and off-platform ads
 * @param ad The ad object
 * @param adStatuses Map of ad statuses from the API
 * @returns The status text
 */
export const GetAdStatusTextForAd = (ad: Ad, adStatuses: Map<string, GetAdStatusResponseType>) => {
  // For off-platform ads, convert their server status to display status
  if (IsOffPlatformAd(ad)) {
    const displayStatus = ConvertServerAdStatusToDisplayStatus(ad.status);
    return GetAdStatusText(displayStatus);
  }
  // For regular Roblox ads, use the standard status lookup
  return GetBackendAdStatusText(adStatuses, ad.id);
};

export const GetToggleDisabled = ({
  adTogglingShouldBeEnabled,
  campaignStatus,
  campaignToggleLoadingDueToAdToggleMap,
  campaignToggleLoadingMap,
}: {
  adTogglingShouldBeEnabled: boolean;
  campaignStatus: GetCampaignStatusResponseType | undefined;
  campaignToggleLoadingDueToAdToggleMap: Map<string, boolean>;
  campaignToggleLoadingMap: Map<string, boolean>;
}) => {
  if (!campaignStatus) {
    return true;
  }
  const disabledWhileLoading = Boolean(
    campaignToggleLoadingMap.get(campaignStatus.id) ||
    campaignToggleLoadingDueToAdToggleMap.get(campaignStatus.id),
  );
  return campaignStatus.disabled || !adTogglingShouldBeEnabled || disabledWhileLoading;
};

export const IsCompletedStatus = (status: StatusText) =>
  status === StatusText.DISPLAY_STATUS_COMPLETED ||
  status === StatusText.DISPLAY_STATUS_AUTO_COMPLETED;
