import type {
  RobloxBadgesApiBadgeResponse,
  RobloxBadgesApiBadgeMetadataResponse,
  RobloxBadgesApiIconUploadResponse,
  RobloxWebResponsesBadgesBadgeResponseV2,
  V1BadgesBadgeIdGetRequest,
  V1UniversesUniverseIdBadgesGetLimitEnum,
  V1UniversesUniverseIdBadgesGetRequest,
  V1BadgesBadgeIdPatchRequest,
  V1BadgesBadgeIdIconPostRequest,
  V1UniversesUniverseIdFreeBadgesQuotaGetRequest,
  V1UniversesUniverseIdBadgesPostRequest,
  V1UniversesUniverseIdBadgesPatchRequest,
  V1UniversesUniverseIdBadgesGetSortByEnum,
} from '@rbx/client-badges/v1';
import {
  BadgesApi,
  V1UniversesUniverseIdBadgesGetSortOrderEnum,
  V1UniversesUniverseIdBadgesPostRequestPaymentSourceTypeEnum,
} from '@rbx/client-badges/v1';
import GenericBEDEV1Error from './errors/GenericBEDEV1Error';
import { createClientConfiguration } from './utils/createClientConfiguration';
import tryParseResponseError from './utils/tryParseResponseError';

export {
  V1UniversesUniverseIdBadgesGetSortOrderEnum as BadgeSortOrderEnum,
  V1UniversesUniverseIdBadgesGetSortByEnum as BadgeSortByEnum,
  V1UniversesUniverseIdBadgesGetLimitEnum as BadgeGetLimitEnum,
} from '@rbx/client-badges/v1';

const defaultConfiguration = createClientConfiguration('badges', 'bedev1', {
  enableBoundAuthToken: true,
  boundAuthTokenLoadTimeout: 6000,
  boundAuthTokenDataTimeout: 3000,
});

const badgesApi = new BadgesApi(defaultConfiguration);

export type BadgesResponseItem = RobloxBadgesApiBadgeResponse &
  Required<Pick<RobloxBadgesApiBadgeResponse, 'id' | 'name'>>;
export type BadgesResponse = {
  previousPageCursor?: string;
  nextPageCursor?: string;
  data: Array<BadgesResponseItem>;
};
export type GetBadgeByIdResponse = RobloxBadgesApiBadgeResponse;
export type GetBadgesMetadataResponse = RobloxBadgesApiBadgeMetadataResponse;
export type PostNewBadgeResponse = RobloxWebResponsesBadgesBadgeResponseV2;
export type PostBadgeIconResponse = RobloxBadgesApiIconUploadResponse;
export { V1UniversesUniverseIdBadgesPostRequestPaymentSourceTypeEnum as PostNewBadgePaymentSourceType };
export interface BadgesClient {
  getBadges(
    universeId: number,
    sortOrder?: keyof typeof V1UniversesUniverseIdBadgesGetSortOrderEnum,
    limit?: V1UniversesUniverseIdBadgesGetLimitEnum,
    cursor?: string,
    sortBy?: V1UniversesUniverseIdBadgesGetSortByEnum,
  ): Promise<BadgesResponse>;
  getBadgeDetails(badgeId: number): Promise<GetBadgeByIdResponse>;
  patchBadgeDetails(
    badgeId: number,
    name?: string,
    enabled?: boolean,
    description?: string,
  ): Promise<void>;
  patchBadgeIcon(badgeId: number, requestFiles: Blob): Promise<PostBadgeIconResponse>;
  getBadgesMetadata(): Promise<GetBadgesMetadataResponse>;
  getFreeBadgesQuota(universeId: number): Promise<number>;
  postNewBadge(
    universeId: number,
    requestName?: string,
    requestDescription?: string,
    requestPaymentSourceType?: string,
    requestExpectedCost?: number,
    requestIsActive?: boolean,
    requestFiles?: Blob,
  ): Promise<RobloxWebResponsesBadgesBadgeResponseV2>;
  updateBadgesOrder(universeId: number, bins: object): Promise<object>;
}

const badgesClient: BadgesClient = {
  async getBadges(
    universeId: number,
    sortOrder?: keyof typeof V1UniversesUniverseIdBadgesGetSortOrderEnum,
    limit?: V1UniversesUniverseIdBadgesGetLimitEnum,
    cursor?: string,
    sortBy?: V1UniversesUniverseIdBadgesGetSortByEnum,
  ) {
    const request: V1UniversesUniverseIdBadgesGetRequest = {
      universeId,
      sortOrder: sortOrder && V1UniversesUniverseIdBadgesGetSortOrderEnum[sortOrder],
      limit,
      cursor,
      sortBy,
    };
    const response = await badgesApi.v1UniversesUniverseIdBadgesGet(request);
    return {
      ...response,
      data: response.data
        ? response.data.filter(
            (item): item is BadgesResponseItem => item.id !== undefined && item.name !== undefined,
          )
        : [],
    };
  },
  getBadgeDetails(badgeId: number) {
    const request: V1BadgesBadgeIdGetRequest = {
      badgeId,
    };
    return badgesApi.v1BadgesBadgeIdGet(request);
  },
  async patchBadgeDetails(badgeId: number, name?: string, enabled?: boolean, description?: string) {
    const request: V1BadgesBadgeIdPatchRequest = {
      badgeId,
      request: {
        name,
        description,
        enabled,
      },
    };
    try {
      await badgesApi.v1BadgesBadgeIdPatch(request);
    } catch (e) {
      const badgeError = await tryParseResponseError(e);
      if (badgeError) {
        throw new GenericBEDEV1Error(badgeError.code, badgeError.message);
      } else {
        throw e;
      }
    }
  },
  async patchBadgeIcon(badgeId: number, files: Blob) {
    const request: V1BadgesBadgeIdIconPostRequest = {
      badgeId,
      files,
    };
    try {
      const res = await badgesApi.v1BadgesBadgeIdIconPost(request);
      return res;
    } catch (e) {
      const badgeError = await tryParseResponseError(e);
      if (badgeError) {
        throw new GenericBEDEV1Error(badgeError.code, badgeError.message);
      } else {
        throw e;
      }
    }
  },
  getBadgesMetadata() {
    return badgesApi.v1BadgesMetadataGet();
  },
  getFreeBadgesQuota(universeId: number) {
    const request: V1UniversesUniverseIdFreeBadgesQuotaGetRequest = { universeId };
    return badgesApi.v1UniversesUniverseIdFreeBadgesQuotaGet(request);
  },
  async postNewBadge(
    universeId: number,
    requestName?: string,
    requestDescription?: string,
    paymentSourceType?: string,
    requestExpectedCost?: number,
    requestIsActive?: boolean,
    requestFiles?: Blob,
  ) {
    try {
      let requestPaymentSourceType:
        | V1UniversesUniverseIdBadgesPostRequestPaymentSourceTypeEnum
        | undefined;
      if (paymentSourceType) {
        const matchedPaymentSource = Object.entries(
          V1UniversesUniverseIdBadgesPostRequestPaymentSourceTypeEnum,
        ).find(([key]) => key === paymentSourceType);
        requestPaymentSourceType = matchedPaymentSource?.[1];
        if (!requestPaymentSourceType) {
          throw new Error('Invalid payment source type');
        }
      }
      const request: V1UniversesUniverseIdBadgesPostRequest = {
        universeId,
        requestName,
        requestDescription,
        requestPaymentSourceType,
        requestExpectedCost,
        requestIsActive,
        requestFiles,
      };
      const res = await badgesApi.v1UniversesUniverseIdBadgesPost(request);
      return res;
    } catch (e) {
      const badgeError = await tryParseResponseError(e);
      if (badgeError) {
        throw new GenericBEDEV1Error(badgeError.code, badgeError.message);
      } else {
        throw e;
      }
    }
  },
  async updateBadgesOrder(universeId: number, requestBins: object[]) {
    const requestBody = {
      orderingBins: requestBins,
    };
    const request: V1UniversesUniverseIdBadgesPatchRequest = {
      universeId,
      request: requestBody,
    };
    try {
      const res = await badgesApi.v1UniversesUniverseIdBadgesPatch(request);
      return res;
    } catch (e) {
      const badgeError = await tryParseResponseError(e);
      if (badgeError) {
        throw new GenericBEDEV1Error(badgeError.code, badgeError.message);
      } else {
        throw e;
      }
    }
  },
};

export default badgesClient;
