import adsClient from '@clients/ads';
import DateFilteringTimePeriod from '@constants/dateFilteringTimePeriod';
import { UNIFIED_ATTRIBUTION_TRACING_HEADERS } from '@constants/debugging';
import ReportingViewType from '@constants/reportingViewType';
import { ListAdsResponseType } from '@type/ad';
import {
  GetSimplifiedCampaignResponseType,
  ListCampaignsResponseType,
  PaginationOptions,
} from '@type/campaign';
import { GetUrlWithParams } from '@utils/url';

const getPaginationString = (paginationOptions?: PaginationOptions) => {
  const pageSize = paginationOptions?.pageSize;
  const cursor = paginationOptions?.cursor;
  const pageSizeParameter = pageSize ? `&page_size=${pageSize}` : '';
  const cursorParameter = cursor ? `&cursor=${cursor}` : '';
  return `${pageSizeParameter}${cursorParameter}`;
};

export const getCampaigns = async (paginationOptions?: PaginationOptions) => {
  const pagination = getPaginationString(paginationOptions);
  const response = await adsClient.get<ListCampaignsResponseType>({
    url: `/v3/native/campaigns?${pagination}`,
  });

  return response.data;
};

export const getDateFilteredCampaigns = async ({
  abortSignal,
  groupId,
  paginationOptions,
  reportingView,
  requestTimestamp,
  timePeriod,
}: {
  /** Optional AbortSignal for request cancellation */
  abortSignal?: AbortSignal;
  groupId?: number;
  paginationOptions?: PaginationOptions;
  reportingView: ReportingViewType;
  requestTimestamp: string;
  timePeriod: DateFilteringTimePeriod;
}) => {
  const pagination = getPaginationString(paginationOptions);
  const groupIdParameter = groupId ? `&groupId=${groupId}` : '';
  const headers =
    reportingView !== undefined &&
    reportingView !== ReportingViewType.REPORTING_VIEW_TYPE_UNSPECIFIED
      ? UNIFIED_ATTRIBUTION_TRACING_HEADERS
      : undefined;

  const response = await adsClient.get<ListCampaignsResponseType>({
    abortSignal,
    headers,
    url: `/v3/native/campaigns/dateFilter?request_timestamp=${requestTimestamp}&time_period=${timePeriod}&reporting_view=${reportingView}${pagination}${groupIdParameter}`,
  });

  return response.data;
};

export const getDateFilteredAds = async ({
  campaignIds,
  paginationOptions,
  reportingView,
  requestTimestamp,
  timePeriod,
}: {
  campaignIds: string[];
  paginationOptions?: PaginationOptions;
  reportingView: ReportingViewType;
  requestTimestamp: string;
  timePeriod: DateFilteringTimePeriod;
}) => {
  const pagination = getPaginationString(paginationOptions);
  const headers =
    reportingView !== undefined &&
    reportingView !== ReportingViewType.REPORTING_VIEW_TYPE_UNSPECIFIED
      ? UNIFIED_ATTRIBUTION_TRACING_HEADERS
      : undefined;

  const response = await adsClient.post<ListAdsResponseType>({
    body: { campaign_ids: campaignIds },
    headers,
    url: `/v2/native/ads/dateFilter?request_timestamp=${requestTimestamp}&time_period=${timePeriod}&reporting_view=${reportingView}${pagination}`,
  });

  return response.data;
};

export const getSimplifiedCampaign = async (
  campaignId: string,
  includeOffPlatformCreatives: boolean = false,
) => {
  const params: Record<string, string> = {};
  if (includeOffPlatformCreatives) {
    params.include_off_platform_creatives = 'true';
  }
  const url = GetUrlWithParams(`/v3/native/campaigns/${campaignId}`, params);
  const response = await adsClient.get<GetSimplifiedCampaignResponseType>({
    url,
  });

  return response.data;
};
