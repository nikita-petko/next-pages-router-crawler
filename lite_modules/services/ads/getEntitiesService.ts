import adsClient from '@clients/ads';
import DateFilteringTimePeriod from '@constants/dateFilteringTimePeriod';
import { UNIFIED_ATTRIBUTION_TRACING_HEADERS } from '@constants/debugging';
import ReportingViewType from '@constants/reportingViewType';
import { getCustomDateSection } from '@services/ads/customDateSection';
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

const getUniverseIdsQueryString = (universeIds?: number[]) => {
  if (!universeIds?.length) {
    return '';
  }
  return universeIds.map((universeId) => `&universe_id=${universeId}`).join('');
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
  customEndDate,
  customStartDate,
  groupId,
  includePerformance,
  paginationOptions,
  reportingView,
  requestTimestamp,
  timePeriod,
  universeIds,
}: {
  /** Optional AbortSignal for request cancellation */
  abortSignal?: AbortSignal;
  /** YYYY-MM-DD, required (with customEndDate) when timePeriod === CUSTOM. */
  customEndDate?: string;
  customStartDate?: string;
  groupId?: number;
  includePerformance?: boolean;
  paginationOptions?: PaginationOptions;
  reportingView: ReportingViewType;
  requestTimestamp: string;
  timePeriod: DateFilteringTimePeriod;
  universeIds?: number[];
}) => {
  const pagination = getPaginationString(paginationOptions);
  const universeIdsQuery = getUniverseIdsQueryString(universeIds);
  const groupIdParameter = groupId ? `&groupId=${groupId}` : '';
  const customDateSection = getCustomDateSection(customStartDate, customEndDate);
  const includePerformanceParameter =
    includePerformance === undefined ? '' : `&include_performance=${includePerformance}`;
  const headers =
    reportingView !== undefined &&
    reportingView !== ReportingViewType.REPORTING_VIEW_TYPE_UNSPECIFIED
      ? UNIFIED_ATTRIBUTION_TRACING_HEADERS
      : undefined;

  const response = await adsClient.get<ListCampaignsResponseType>({
    abortSignal,
    headers,
    url: `/v3/native/campaigns/dateFilter?request_timestamp=${requestTimestamp}&time_period=${timePeriod}&reporting_view=${reportingView}${pagination}${universeIdsQuery}${groupIdParameter}${includePerformanceParameter}${customDateSection}`,
  });

  return response.data;
};

export const getDateFilteredAds = async ({
  abortSignal,
  campaignIds,
  customEndDate,
  customStartDate,
  includePerformance,
  paginationOptions,
  reportingView,
  requestTimestamp,
  timePeriod,
}: {
  abortSignal?: AbortSignal;
  campaignIds: string[];
  customEndDate?: string;
  customStartDate?: string;
  includePerformance?: boolean;
  paginationOptions?: PaginationOptions;
  reportingView: ReportingViewType;
  requestTimestamp: string;
  timePeriod: DateFilteringTimePeriod;
}) => {
  const pagination = getPaginationString(paginationOptions);
  const customDateSection = getCustomDateSection(customStartDate, customEndDate);
  const includePerformanceParameter =
    includePerformance === undefined ? '' : `&include_performance=${includePerformance}`;
  const headers =
    reportingView !== undefined &&
    reportingView !== ReportingViewType.REPORTING_VIEW_TYPE_UNSPECIFIED
      ? UNIFIED_ATTRIBUTION_TRACING_HEADERS
      : undefined;

  const response = await adsClient.post<ListAdsResponseType>({
    abortSignal,
    body: { campaign_ids: campaignIds },
    headers,
    url: `/v2/native/ads/dateFilter?request_timestamp=${requestTimestamp}&time_period=${timePeriod}&reporting_view=${reportingView}${pagination}${includePerformanceParameter}${customDateSection}`,
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
