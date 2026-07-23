import { useMutation, useQuery } from '@tanstack/react-query';
import type { PageResponse } from '@rbx/core';
import { getEnabledItemType } from '@modules/creations/avatarCreationTokens/utils/formHelpers';
import type { BundleType } from '@modules/creations/avatarItem/constants/avatarItemConstants';
import type CreationData from '@modules/creations/common/interfaces/CreationData';
import { translateBundleDetailsToBundleInfoType } from '@modules/creations/unifiedFeeSystem/helper/UnifiedFeeSystemHelper';
import type { Asset } from '@modules/miscellaneous/common';
import { Item } from '@modules/miscellaneous/common';
import { OCAvatarCreationTokenError, parseError } from './openCloudAvatarCreationTokenErrorHandler';
import {
  createAvatarCreationToken,
  getAvatarCreationToken,
  getPricingPolicy,
  updateAvatarCreationToken,
  listAvatarCreationTokens,
  getTokenIdFromPath,
  getUniverseIdFromPath,
} from './openCloudAvatarCreationTokensRequests';
import type {
  AvatarCreationToken,
  CreateAvatarCreationTokenParams,
  GetAvatarCreationTokenParams,
  GetPricingPolicyParams,
  UpdateAvatarCreationTokenParams,
} from './openCloudAvatarCreationTokensRequests';

// Matches the legacy V2CloudClient page size; large enough to fit a typical
// experience's tokens in one request without paginating, small enough to keep
// the dropdown render snappy.
const LIST_TOKENS_PAGE_SIZE = 30;

export function CreateAvatarCreationToken() {
  return useMutation({
    mutationKey: ['createAvatarCreationToken'],
    mutationFn: async (request: CreateAvatarCreationTokenParams) => {
      try {
        await createAvatarCreationToken(request);
        return undefined;
      } catch (error) {
        return parseError(error);
      }
    },
  });
}

export function useListAvatarCreationTokens(
  experienceId: number | undefined,
  isAssetType: boolean,
  itemType: Asset | BundleType,
) {
  return useQuery({
    enabled: experienceId !== undefined,
    // Include isAssetType and itemType in the query key to ensure the tokens list is updated when they change
    queryKey: [`${experienceId}_listAvatarCreationTokens`, isAssetType, itemType],
    queryFn: async (): Promise<PageResponse<CreationData> | OCAvatarCreationTokenError> => {
      try {
        const response = await listAvatarCreationTokens({
          universeId: String(experienceId),
          maxPageSize: LIST_TOKENS_PAGE_SIZE,
          filter: isAssetType
            ? `asset_type==AssetType.${itemType}`
            : `bundle_type==BundleType.${itemType}`,
        });

        const formattedData =
          response.avatarCreationTokens?.map(
            (token: AvatarCreationToken): CreationData => ({
              itemType: Item.AvatarCreationToken,
              name: token.displayName ?? '',
              // OpenCloud returns Robux fields as strings on the wire; coerce
              // so downstream price math never silently concatenates strings.
              // oxlint-disable-next-line typescript/no-unnecessary-type-conversion -- runtime payload may be a string despite typed as `number`
              price: Number(token.dynamicPrice?.currentPriceRobux ?? 0),
              hidePricingInfo: false,
              assetId: getTokenIdFromPath(token.path),
              isClickable: true,
              assetType: token.itemType?.assetType
                ? // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- discriminated by the assetType branch above
                  (getEnabledItemType(token.itemType) as Asset)
                : undefined,
              bundleType: token.itemType?.bundleType
                ? translateBundleDetailsToBundleInfoType(
                    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- discriminated by the bundleType branch above
                    getEnabledItemType(token.itemType) as BundleType,
                  )
                : undefined,
              universeId: getUniverseIdFromPath(token.path),
            }),
          ) ?? [];

        return { items: formattedData };
      } catch (error) {
        const errorKey = await parseError(error);

        if (errorKey === 'Message.MissingGroupPermission') {
          return OCAvatarCreationTokenError.UserMissingGroupPermissionsToListAvatarCreationTokens;
        }
        if (errorKey === 'Message.AccessDenied') {
          return OCAvatarCreationTokenError.AccessDeniedToListAvatarCreationTokens;
        }
        return OCAvatarCreationTokenError.FailedToListAvatarCreationTokens;
      }
    },
  });
}

export function GetTokenDetails(request: GetAvatarCreationTokenParams) {
  return useMutation({
    mutationKey: ['getTokenDetails'],
    mutationFn: () => getAvatarCreationToken(request),
  });
}

export function UpdateAvatarCreationToken() {
  return useMutation({
    mutationKey: ['updateAvatarCreationToken'],
    mutationFn: async (request: UpdateAvatarCreationTokenParams) => {
      try {
        await updateAvatarCreationToken(request);
        return undefined;
      } catch (error) {
        return parseError(error);
      }
    },
  });
}

export function GetPricingPolicy() {
  return useMutation({
    mutationKey: ['getPricingPolicy'],
    mutationFn: (request: GetPricingPolicyParams) => getPricingPolicy(request),
  });
}
