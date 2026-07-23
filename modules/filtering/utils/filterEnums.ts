import { ServerAdType } from '@constants/ad';
import { ServerCampaignObjectiveType, ServerPaymentType } from '@constants/campaign';
import {
  getAdSetBidTypeDisplayText,
  getAdStatusFormatDisplayText,
  getCampaignObjectiveDisplayText,
  getPaymentTypeDisplayText,
} from '@modules/clients/ads/serverClientTransformationUtilities';
import { ServerAdSetBidType } from '@type/adSet';

export enum FilterRefresh {
  // Do not refresh filter results
  FILTER_REFRESH_UNSPECIFIED = 0,
  // Refresh filter results because edit happened
  FILTER_REFRESH_AFTER_EDIT = 1,
  // Refresh filter results because date filter happened
  FILTER_REFRESH_AFTER_DATE_FILTER = 2,
}

export const campaignObjectiveEnumKeys: [string, number][] = Object.values(
  ServerCampaignObjectiveType,
)
  .filter((val) => typeof val !== 'string')
  .map((val) => [
    getCampaignObjectiveDisplayText(val as ServerCampaignObjectiveType),
    val as number,
  ]);

// Do not include line of credit as Payment Type filter is only shown to self-serve accounts
export const campaignPaymentMethodEnumKeys: [string, number][] = Object.values(ServerPaymentType)
  .filter(
    (val) =>
      typeof val !== 'string' &&
      val !== ServerPaymentType.PAYMENT_TYPE_UNSPECIFIED &&
      val !== ServerPaymentType.PAYMENT_TYPE_INVOICE,
  )
  .map((val) => [getPaymentTypeDisplayText(val as ServerPaymentType), val as number]);

export const adSetBidTypeEnumKeys: [string, number][] = Object.values(ServerAdSetBidType)
  .filter((val) => typeof val !== 'string')
  .map((val) => [getAdSetBidTypeDisplayText(val as ServerAdSetBidType), val as number]);

export const adFormatEnumKeys: [string, number][] = Object.values(ServerAdType)
  .filter(
    (val) =>
      typeof val !== 'string' && val !== ServerAdType.UNSPECIFIED && val !== ServerAdType.VIDEO_2D,
  )
  .map((val) => [getAdStatusFormatDisplayText(val), val as number]);

export const enumToNum = new Map([
  ...campaignObjectiveEnumKeys,
  ...campaignPaymentMethodEnumKeys,
  ...adSetBidTypeEnumKeys,
  ...adFormatEnumKeys,
]);
