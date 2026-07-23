import { StatusCodes } from '@rbx/core';

import { AdFormatDisplayType } from '@constants/ad';
import DateFilteringTimePeriod from '@constants/dateFilteringTimePeriod';
import { ServerGetAdRowResponse } from '@type/ad';
import { ServerAdSetStatusType, ServerGetAdSetRowResponse } from '@type/adSet';
import {
  GetAdSetStatusResponseType,
  GetAdStatusResponseType,
  GetCampaignStatusResponseType,
  GetUpdatedStatusesResponseType,
} from '@type/campaign';
import { UniverseShapeType } from '@type/universe';
import {
  getAdsManagementApiBaseUrl,
  getAdsManagementApiRequestCredentials,
  getAdsManagementApiRequestHeaders,
} from '@utils/adsManagementApiDevOverride';
import { CaptureException } from '@utils/error';
import { GetSitetestBaseUrl } from '@utils/url';
import { TODOFIXANY } from 'app/shared/types';

import { ServerAdStatusType, SummaryEntityType } from './adsClientTypes';

export * from '@type/advertiser';

function getMergedAdsManagementApiHeaders(
  headers?: Record<string, string> | null,
): Record<string, string> {
  return {
    ...getAdsManagementApiRequestHeaders(),
    ...(headers ?? {}),
  };
}

/**
 * A wrapper for fetch. Use this when making requests to the www client.
 * It takes care of things like including credentials and x-csrf token.
 *
 * With the exclusion of the `get` method which does not require x-csrf so we don't fetch it if it's not already present.
 *
 * Also handles passing along errors.
 */
export class Fetch {
  private csrfToken: string | null;

  constructor() {
    this.csrfToken = null;
  }

  async get(
    url: string,
    headers?: Record<string, string> | null,
    onErrorCallback?: TODOFIXANY,
    retries?: number,
  ): Promise<Response | TODOFIXANY> {
    const credentials = getAdsManagementApiRequestCredentials();
    const options: TODOFIXANY = {
      credentials,
      headers: new Headers({
        'Content-Type': 'application/json; charset=utf-8',
      }),
      method: 'GET',
    };

    if (this.csrfToken) {
      options.headers.set('X-CSRF-TOKEN', this.csrfToken);
    }

    Object.entries(getMergedAdsManagementApiHeaders(headers)).forEach(([key, value]) => {
      options.headers.set(key, value);
    });

    let response;

    try {
      response = await fetch(url, options);
      if (!response.ok) {
        if (retries) {
          return this.get(url, headers, onErrorCallback, retries - 1);
        }
        if (onErrorCallback) {
          onErrorCallback(response); // Only do error callback if this is the last attempt
        }
      }
      const json = await response.json();
      return json;
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
        CaptureException('Error thrown parsing json of response');
      }

      const errorResponseOptions = { status: StatusCodes.INTERNAL_SERVER_ERROR };
      if (typeof error !== 'string') {
        return Promise.resolve(new Response(null, errorResponseOptions));
      }

      return Promise.resolve({ error, response });
    }
  }

  static getWithNoCredentials(url: string): Promise<Response> {
    return fetch(url);
  }

  async post(
    url: string,
    body: Record<string, any> | null,
    headers: Record<string, string> | null,
  ): Promise<Response> {
    const credentials = getAdsManagementApiRequestCredentials();
    const options = {
      body: body ? JSON.stringify(body) : null,
      credentials,
      headers: new Headers({
        'Content-Type': 'application/json; charset=utf-8',
      }),
      method: 'POST',
    };

    if (this.csrfToken) {
      options.headers.set('X-CSRF-TOKEN', this.csrfToken);
      options.headers.set('x-csrf-token', this.csrfToken);
    }

    Object.entries(getMergedAdsManagementApiHeaders(headers)).forEach(([key, value]) => {
      options.headers.set(key, value);
    });

    try {
      const response = await fetch(url, options);
      if (
        response.status === StatusCodes.FORBIDDEN ||
        response.status === StatusCodes.INTERNAL_SERVER_ERROR
      ) {
        const responseCsrfToken =
          response.headers.get('X-CSRF-TOKEN') || response.headers.get('x-csrf-token');
        if (responseCsrfToken) {
          this.csrfToken = responseCsrfToken;
          options.headers.set('X-CSRF-TOKEN', this.csrfToken);
          options.headers.set('x-csrf-token', this.csrfToken);
          const secondResponse = await fetch(url, options);
          return secondResponse;
        }
      }
      // Clear the CSRF token while proxy is having issues.
      this.csrfToken = null;

      return response;
    } catch (error: unknown) {
      this.csrfToken = null;

      const errorResponseOptions = { status: StatusCodes.INTERNAL_SERVER_ERROR };
      if (typeof error !== 'string') {
        return Promise.resolve(new Response(null, errorResponseOptions));
      }

      return Promise.resolve(new Response(error, errorResponseOptions));
    }
  }

  async patch(
    url: string,
    body: Record<string, unknown> | null,
    headers: Record<string, string> | null,
  ): Promise<Response> {
    const credentials = getAdsManagementApiRequestCredentials();
    const options = {
      body: body ? JSON.stringify(body) : null,
      credentials,
      headers: new Headers({
        'Content-Type': 'application/json; charset=utf-8',
      }),
      method: 'PATCH',
    };

    if (this.csrfToken) {
      options.headers.set('X-CSRF-TOKEN', this.csrfToken);
    }

    Object.entries(getMergedAdsManagementApiHeaders(headers)).forEach(([key, value]) => {
      options.headers.set(key, value);
    });

    try {
      const response = await fetch(url, options);
      if (response.status === StatusCodes.FORBIDDEN) {
        const responseCsrfToken = response.headers.get('X-CSRF-TOKEN');
        if (responseCsrfToken) {
          this.csrfToken = responseCsrfToken;
          options.headers.set('X-CSRF-TOKEN', this.csrfToken);
          const secondResponse = await fetch(url, options);
          return secondResponse;
        }
      }
      return response;
    } catch (error: unknown) {
      const errorResponseOptions = { status: StatusCodes.INTERNAL_SERVER_ERROR };
      if (typeof error !== 'string') {
        return Promise.resolve(new Response(null, errorResponseOptions));
      }
      return Promise.resolve(new Response(error, errorResponseOptions));
    }
  }

  async delete(url: string, headers: Record<string, string> | null): Promise<Response> {
    const credentials = getAdsManagementApiRequestCredentials();
    const options = {
      credentials,
      headers: new Headers({
        'Content-Type': 'application/json; charset=utf-8',
      }),
      method: 'DELETE',
    };

    if (this.csrfToken) {
      options.headers.set('X-CSRF-TOKEN', this.csrfToken);
    }

    Object.entries(getMergedAdsManagementApiHeaders(headers)).forEach(([key, value]) => {
      options.headers.set(key, value);
    });

    try {
      const response = await fetch(url, options);
      if (response.status === StatusCodes.FORBIDDEN) {
        const responseCsrfToken = response.headers.get('X-CSRF-TOKEN');
        if (responseCsrfToken) {
          this.csrfToken = responseCsrfToken;
          options.headers.set('X-CSRF-TOKEN', this.csrfToken);
          const secondResponse = await fetch(url, options);
          return secondResponse;
        }
      }
      return response;
    } catch (error: unknown) {
      const errorResponseOptions = { status: StatusCodes.INTERNAL_SERVER_ERROR };
      if (typeof error !== 'string') {
        return Promise.resolve(new Response(null, errorResponseOptions));
      }
      return Promise.resolve(new Response(error, errorResponseOptions));
    }
  }
}

const fetchClient = new Fetch();

export const siteBasedUrl = GetSitetestBaseUrl();

const constructQueryParams = (
  paramsObj: Record<string, string | number | undefined | null>,
): string => {
  const params = new URLSearchParams();
  const keys = Object.keys(paramsObj);

  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const value = paramsObj[key];

    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  }
  return params.toString();
};

export const getCampaign = async (campaignId: string) => {
  return fetchClient.get(`${getAdsManagementApiBaseUrl()}/v1/campaigns/${campaignId}`);
};

export const getCampaignV2 = async (campaignId: string) => {
  return fetchClient.get(`${getAdsManagementApiBaseUrl()}/v2/campaigns/${campaignId}`);
};

export const getAdSet = async (adSetId: string) => {
  return fetchClient.get(`${getAdsManagementApiBaseUrl()}/v1/adSets/${adSetId}`);
};

export const getAd = async (adId: string) => {
  return fetchClient.get(`${getAdsManagementApiBaseUrl()}/v1/ads/${adId}`);
};

export interface CategoryFilter {
  field: string;
  values: number[];
}

interface FiltersOnEntity {
  category_filters?: CategoryFilter[];
  text?: string;
}

export interface ListFilteredIdsRequestType {
  ad_filter?: FiltersOnEntity;
  ad_set_filter?: FiltersOnEntity;
  campaign_filter?: FiltersOnEntity;
}

interface ListFilteredIdsResponseType {
  entity_type: SummaryEntityType;
  ids: string[];
}

export const getFilteredIds = async (
  filterRequest: ListFilteredIdsRequestType,
): Promise<ListFilteredIdsResponseType> => {
  const getFilteredIdsResponseRequest = await fetchClient.post(
    `${getAdsManagementApiBaseUrl()}/v1/filter`,
    {
      ad_filter: filterRequest.ad_filter,
      ad_set_filter: filterRequest.ad_set_filter,
      campaign_filter: filterRequest.campaign_filter,
    },
    {},
  );

  if (!getFilteredIdsResponseRequest.ok) {
    CaptureException(getFilteredIdsResponseRequest);
    throw new Error(getFilteredIdsResponseRequest.status.toString());
  }

  const getFilteredIdsResponseRequestResult = await getFilteredIdsResponseRequest.json();

  return getFilteredIdsResponseRequestResult;
};

export const getCampaignStatus = async (
  campaignIds: string[],
): Promise<GetCampaignStatusResponseType[]> => {
  const getCampaignStatusResponseRequest = await fetchClient.post(
    `${getAdsManagementApiBaseUrl()}/v1/campaigns/status`,
    { campaign_ids: campaignIds },
    {},
  );

  if (!getCampaignStatusResponseRequest.ok) {
    CaptureException(getCampaignStatusResponseRequest);
    throw new Error(getCampaignStatusResponseRequest.status.toString());
  }

  const getCampaignStatusResponseRequestResult = await getCampaignStatusResponseRequest.json();

  return getCampaignStatusResponseRequestResult;
};

export const getAdSetStatus = async (adSetIds: string[]): Promise<GetAdSetStatusResponseType[]> => {
  const getAdSetStatusResponseRequest = await fetchClient.post(
    `${getAdsManagementApiBaseUrl()}/v1/adSets/status`,
    { ad_set_ids: adSetIds },
    {},
  );

  if (!getAdSetStatusResponseRequest.ok) {
    CaptureException(getAdSetStatusResponseRequest);
    throw new Error(getAdSetStatusResponseRequest.status.toString());
  }

  const getAdSetStatusResponseRequestResult = await getAdSetStatusResponseRequest.json();

  return getAdSetStatusResponseRequestResult;
};

export const getAdStatus = async (adIds: string[]): Promise<GetAdStatusResponseType[]> => {
  const getAdStatusResponseRequest = await fetchClient.post(
    `${getAdsManagementApiBaseUrl()}/v1/ads/status`,
    { ad_ids: adIds },
    {},
  );

  if (!getAdStatusResponseRequest.ok) {
    CaptureException(getAdStatusResponseRequest);
    throw new Error(getAdStatusResponseRequest.status.toString());
  }

  const getAdStatusResponseRequestResult = await getAdStatusResponseRequest.json();

  return getAdStatusResponseRequestResult;
};

export const getUpdatedStatuses = async (
  campaignId: string,
): Promise<GetUpdatedStatusesResponseType> => {
  const getUpdatedStatusesResponseRequest = await fetch(
    `${getAdsManagementApiBaseUrl()}/v1/campaigns/updatedStatus/${campaignId}`,
    {
      credentials: getAdsManagementApiRequestCredentials(),
      headers: getMergedAdsManagementApiHeaders(),
    },
  );

  if (!getUpdatedStatusesResponseRequest.ok) {
    CaptureException(getUpdatedStatusesResponseRequest);
    throw new Error(getUpdatedStatusesResponseRequest.status.toString());
  }

  const getUpdatedStatusesResponseRequestResult = await getUpdatedStatusesResponseRequest.json();

  return getUpdatedStatusesResponseRequestResult;
};

interface GetCampaignsResponseType {
  campaigns: TODOFIXANY[];
  next_cursor: string;
}

// GET
export const getCampaignsV2 = async (
  pageSize?: number,
  cursor?: string,
): Promise<GetCampaignsResponseType> => {
  const pageSizeParameter = pageSize !== undefined ? `page_size=${pageSize}` : '';
  const cursorParameter = cursor !== undefined ? `cursor=${cursor}` : '';

  const campaignsResponseRequest = await fetch(
    `${getAdsManagementApiBaseUrl()}/v2/campaigns?${pageSizeParameter}&${cursorParameter}`,
    {
      credentials: getAdsManagementApiRequestCredentials(),
      headers: getMergedAdsManagementApiHeaders(),
    },
  );

  if (campaignsResponseRequest.status !== 200) {
    CaptureException(campaignsResponseRequest);
    throw new Error('Could not fetch campaigns');
  }

  const campaignsResponseRequestResult = await campaignsResponseRequest.json();

  return campaignsResponseRequestResult;
};

export const getDateFilteredCampaignsV2 = async (
  requestTimestamp: string,
  timePeriod: DateFilteringTimePeriod,
  pageSize?: number,
  cursor?: string,
  onErrorCallback?: TODOFIXANY,
): Promise<GetCampaignsResponseType> => {
  const params = {
    cursor,
    page_size: pageSize,
    request_timestamp: requestTimestamp,
    time_period: timePeriod,
  };

  const campaignsResponseRequest = await fetch(
    `${getAdsManagementApiBaseUrl()}/v2/campaigns/dateFilter?${constructQueryParams(params)}`,
    {
      credentials: getAdsManagementApiRequestCredentials(),
      headers: getMergedAdsManagementApiHeaders(),
    },
  );

  if (!campaignsResponseRequest.ok) {
    CaptureException(campaignsResponseRequest);
    if (onErrorCallback) {
      onErrorCallback(campaignsResponseRequest);
    }
    throw new Error('Could not fetch date filtered campaigns');
  }

  const campaignsResponseRequestResult = await campaignsResponseRequest.json();

  return campaignsResponseRequestResult;
};

interface GetAdSetResponseType {
  ad_sets: ServerGetAdSetRowResponse[];
  next_cursor: string;
}

// GET
export const getAdSets = async (
  pageSize?: number,
  cursor?: string,
): Promise<GetAdSetResponseType> => {
  const pageSizeParameter = pageSize !== undefined ? `page_size=${pageSize}` : '';
  const cursorParameter = cursor !== undefined ? `cursor=${cursor}` : '';

  const adSetsResponseRequest = await fetch(
    `${getAdsManagementApiBaseUrl()}/v1/adSets?${pageSizeParameter}&${cursorParameter}`,
    {
      credentials: getAdsManagementApiRequestCredentials(),
      headers: getMergedAdsManagementApiHeaders(),
    },
  );

  const adSetsResponseRequestResult = await adSetsResponseRequest.json();

  return adSetsResponseRequestResult;
};

export const getDateFilteredAdSets = async (
  data: TODOFIXANY,
  requestTimestamp: string,
  timePeriod: DateFilteringTimePeriod,
  pageSize?: number,
  cursor?: string,
  onErrorCallback?: TODOFIXANY,
): Promise<GetAdSetResponseType> => {
  const pageSizeParameter = pageSize !== undefined ? `page_size=${pageSize}` : '';
  const cursorParameter = cursor !== undefined ? `cursor=${cursor}` : '';

  const adSetsResponseRequest = await fetchClient.post(
    `${getAdsManagementApiBaseUrl()}/v1/adSets/dateFilter?${pageSizeParameter}&${cursorParameter}&request_timestamp=${requestTimestamp}&time_period=${timePeriod}`,
    data,
    {},
  );

  if (!adSetsResponseRequest.ok) {
    CaptureException(adSetsResponseRequest);
    if (onErrorCallback) {
      onErrorCallback(adSetsResponseRequest);
    }
    throw new Error('Could not fetch date filtered ad sets');
  }

  const adSetsResponseRequestResult = await adSetsResponseRequest.json();

  return adSetsResponseRequestResult;
};

interface GetAdsResponseType {
  ads: ServerGetAdRowResponse[];
  next_cursor: string;
}

// GET
export const getAds = async (pageSize?: number, cursor?: string): Promise<GetAdsResponseType> => {
  const pageSizeParameter = pageSize !== undefined ? `page_size=${pageSize}` : '';
  const cursorParameter = cursor !== undefined ? `cursor=${cursor}` : '';

  const adsResponseRequest = await fetch(
    `${getAdsManagementApiBaseUrl()}/v1/ads?${pageSizeParameter}&${cursorParameter}`,
    {
      credentials: getAdsManagementApiRequestCredentials(),
      headers: getMergedAdsManagementApiHeaders(),
    },
  );

  const adsResponseRequestResult = await adsResponseRequest.json();

  return adsResponseRequestResult;
};

export const getDateFilteredAds = async (
  data: TODOFIXANY,
  requestTimestamp: string,
  timePeriod: DateFilteringTimePeriod,
  pageSize?: number,
  cursor?: string,
  onErrorCallback?: TODOFIXANY,
): Promise<GetAdsResponseType> => {
  const pageSizeParameter = pageSize !== undefined ? `page_size=${pageSize}` : '';
  const cursorParameter = cursor !== undefined ? `cursor=${cursor}` : '';

  const adsResponseRequest = await fetchClient.post(
    `${getAdsManagementApiBaseUrl()}/v1/ads/dateFilter?${pageSizeParameter}&${cursorParameter}&request_timestamp=${requestTimestamp}&time_period=${timePeriod}`,
    data,
    {},
  );

  if (!adsResponseRequest.ok) {
    CaptureException(adsResponseRequest);
    if (onErrorCallback) {
      onErrorCallback(adsResponseRequest);
    }
    throw new Error('Could not fetch date filtered ads');
  }

  const adsResponseRequestResult = await adsResponseRequest.json();

  return adsResponseRequestResult;
};

export interface ListAdFormatsResponseType {
  formats_to_display: AdFormatDisplayType[];
}

// GET
export const listAdFormats = async (): Promise<ListAdFormatsResponseType> => {
  return fetchClient.get(`${getAdsManagementApiBaseUrl()}/v1/adFormats`);
};

interface GetSummaryResponseType {
  ad_credit_average_cost_per_mille?: number;
  ad_credit_average_cost_per_play?: number;
  ad_credit_display_spending?: number;
  average_cost_per_mille?: number;
  average_cost_per_teleport?: number;
  average_play_rate?: number;
  chargeable_spend_ads_credit?: number;
  chargeable_spend_micro_usd?: number;
  click_count?: number;
  cost_per_fifteen_sec_video_view_usd?: number;
  count?: number;
  display_spending?: number;
  fifteen_sec_video_view_count?: number;
  impression_count?: number;
  play_count?: number;
  teleport_count?: number;
  teleport_rate?: number;
  total_play_time_hours_7d?: number;
  total_robux_revenue_30d?: number;
  two_sec_video_view_count?: number;
  usd_average_cost_per_mille?: number;
  usd_average_cost_per_play?: number;
  usd_display_spending?: number;
}

export const getCampaignsSummary = async (): Promise<GetSummaryResponseType> => {
  return fetchClient.get(
    `${getAdsManagementApiBaseUrl()}/v1/adAccountSummary?entity_type=${SummaryEntityType.ENTITY_TYPE_CAMPAIGN}`,
  );
};

export const getDateFilteredCampaignsSummary = async (
  requestTimestamp: string,
  timePeriod: DateFilteringTimePeriod,
  onErrorCallback?: TODOFIXANY,
): Promise<GetSummaryResponseType> => {
  return fetchClient.get(
    `${getAdsManagementApiBaseUrl()}/v1/adAccountSummary/dateFilter?entity_type=${SummaryEntityType.ENTITY_TYPE_CAMPAIGN}&request_timestamp=${requestTimestamp}&time_period=${timePeriod}`,
    undefined,
    onErrorCallback,
  );
};

// GET
export const getAdSetsSummary = async (): Promise<GetSummaryResponseType> => {
  return fetchClient.get(
    `${getAdsManagementApiBaseUrl()}/v1/adAccountSummary?entity_type=${SummaryEntityType.ENTITY_TYPE_AD_SET}`,
  );
};

export const getDateFilteredAdSetsSummary = async (
  requestTimestamp: string,
  timePeriod: DateFilteringTimePeriod,
  onErrorCallback?: TODOFIXANY,
): Promise<GetSummaryResponseType> => {
  return fetchClient.get(
    `${getAdsManagementApiBaseUrl()}/v1/adAccountSummary/dateFilter?entity_type=${SummaryEntityType.ENTITY_TYPE_AD_SET}&request_timestamp=${requestTimestamp}&time_period=${timePeriod}`,
    undefined,
    onErrorCallback,
  );
};

// GET
export const getAdsSummary = async (): Promise<GetSummaryResponseType> => {
  return fetchClient.get(
    `${getAdsManagementApiBaseUrl()}/v1/adAccountSummary?entity_type=${SummaryEntityType.ENTITY_TYPE_AD}`,
  );
};

export const getDateFilteredAdsSummary = async (
  requestTimestamp: string,
  timePeriod: DateFilteringTimePeriod,
  onErrorCallback?: TODOFIXANY,
): Promise<GetSummaryResponseType> => {
  return fetchClient.get(
    `${getAdsManagementApiBaseUrl()}/v1/adAccountSummary/dateFilter?entity_type=${SummaryEntityType.ENTITY_TYPE_AD}&request_timestamp=${requestTimestamp}&time_period=${timePeriod}`,
    undefined,
    onErrorCallback,
  );
};

interface UniversesResponseShape {
  universes: UniverseShapeType[];
}

export const getCanAccessUniverses = async (): Promise<UniversesResponseShape> => {
  return fetchClient.get(`${getAdsManagementApiBaseUrl()}/v1/universes`, null, null, 2); // 2 retries for universes fetch
};

export const getAudienceEstimate = async (data: TODOFIXANY): Promise<TODOFIXANY> => {
  return fetchClient.post(`${getAdsManagementApiBaseUrl()}/v1/audience`, data, {});
};

type CreateCampaignV2Request = Record<string, unknown>;

export const createCampaignV2 = async (data: CreateCampaignV2Request) => {
  return fetchClient.post(`${getAdsManagementApiBaseUrl()}/v2/campaigns`, data, {});
};

export const createAdSetV2 = async (data: TODOFIXANY) => {
  return fetchClient.post(`${getAdsManagementApiBaseUrl()}/v2/adSets`, data, {});
};

export const createAdV2 = async (data: TODOFIXANY) => {
  return fetchClient.post(`${getAdsManagementApiBaseUrl()}/v2/ads`, data, {});
};

export const toggleAdSet = async (
  adSetId: string,
  status: ServerAdSetStatusType.ENABLED | ServerAdSetStatusType.STOPPED,
) => {
  const data = {
    ad_set: {
      status,
    },
  };
  return fetchClient.patch(`${getAdsManagementApiBaseUrl()}/v1/adSets/${adSetId}`, data, {});
};

export const deleteAdSet = async (adSetId: string) => {
  const data = {
    ad_set: {
      status: ServerAdSetStatusType.ARCHIVED,
    },
  };
  return fetchClient.patch(`${getAdsManagementApiBaseUrl()}/v1/adSets/${adSetId}`, data, {});
};

export const deleteAd = async (adId: string) => {
  return fetchClient.delete(`${getAdsManagementApiBaseUrl()}/v1/ads/${adId}`, {});
};

export const toggleAd = async (
  adId: string,
  status: ServerAdStatusType.ENABLED | ServerAdStatusType.STOPPED,
) => {
  const data = {
    ad: {
      status,
    },
  };
  return fetchClient.patch(`${getAdsManagementApiBaseUrl()}/v1/ads/${adId}`, data, {});
};

export const deleteCampaign = async (campaignId: string) => {
  return fetchClient.delete(`${getAdsManagementApiBaseUrl()}/v1/campaigns/${campaignId}`, {});
};

export const cancelCampaign = async (campaignId: string) => {
  const data = {
    campaign: {
      status: ServerAdSetStatusType.CANCELLED,
    },
  };
  return fetchClient.patch(`${getAdsManagementApiBaseUrl()}/v1/campaigns/${campaignId}`, data, {});
};

export const toggleCampaign = async (
  campaignId: string,
  status: ServerAdStatusType.ENABLED | ServerAdStatusType.STOPPED,
) => {
  const data = {
    campaign: {
      status,
    },
  };
  return fetchClient.patch(`${getAdsManagementApiBaseUrl()}/v1/campaigns/${campaignId}`, data, {});
};

export const updateCampaign = async (campaignId: string, data: TODOFIXANY) => {
  return fetchClient.patch(`${getAdsManagementApiBaseUrl()}/v1/campaigns/${campaignId}`, data, {});
};

export const updateAdSet = async (adSetId: string, data: TODOFIXANY) => {
  return fetchClient.patch(`${getAdsManagementApiBaseUrl()}/v1/adSets/${adSetId}`, data, {});
};

export const updateAd = async (adId: string, data: TODOFIXANY) => {
  return fetchClient.patch(`${getAdsManagementApiBaseUrl()}/v1/ads/${adId}`, data, {});
};

// Report Download
interface GetFilteredAdSetsRequest {
  adAccountId: string;
  filterIds: string[];
}

export const getFilteredAdsets = async (data: Partial<GetFilteredAdSetsRequest>) => {
  return fetchClient.post(`${getAdsManagementApiBaseUrl()}/v1/adSets/filter`, data, {});
};

interface GetFilteredAdsRequest {
  adAccountId: string;
  filterIds: string[];
  filterType: 'CAMPAIGNS' | 'ADSETS';
}

export const getFilteredAds = async (data: Partial<GetFilteredAdsRequest>) => {
  return fetchClient.post(`${getAdsManagementApiBaseUrl()}/v1/ads/filter`, data, {});
};

// validate if display name is valid
export enum PreviewAdTypeEnum {
  PREVIEW_AD_TYPE_UNSPECIFIED = 0,
  PREVIEW_AD_TYPE_IMAGE = 1,
  PREVIEW_AD_TYPE_PORTAL = 2,
  PREVIEW_AD_TYPE_VIDEO_CPV_15 = 3,
  PREVIEW_AD_TYPE_VIDEO_CPM = 4,
}

export interface PreviewAdRequest {
  preview_ad: {
    display_ad_metadata?: {
      asset_metadata: {
        asset_id: string;
      };
    };
    portal_ad_metadata?: {
      banner_asset_metadata: {
        asset_id: string;
      };
      target_place_id: number;
    };
    preview_ad_type: PreviewAdTypeEnum;
    video_ad_metadata?: {
      asset_metadata: {
        asset_id: string;
      };
    };
  };
}

export const previewAd = async (data: Partial<PreviewAdRequest>): Promise<Response> =>
  fetchClient.post(`${getAdsManagementApiBaseUrl()}/v1/ads/preview`, data, {});
