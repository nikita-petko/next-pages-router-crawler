import { useMutation, useQuery } from '@tanstack/react-query';
import { V2CloudProtos } from '@rbx/open-cloud';
import { Asset, Item } from '@modules/miscellaneous/common';
import { PageResponse } from '@rbx/core';
import {
  BundleType,
  CreationData,
  getEnabledItemType,
  translateBundleDetailsToBundleInfoType,
} from '@modules/creations';
import { OpenCloudError } from '@rbx/google-gax';
import {
  OCAvatarCreationTokenError,
  parseError,
  UnknownErrorMessageKey,
} from './openCloudAvatarCreationTokenErrorHandler';
import {
  createAvatarCreationToken,
  getAvatarCreationToken,
  getPricingPolicy,
  updateAvatarCreationToken,
  listAvatarCreationTokens,
  getTokenIdFromPath,
  getUniverseIdFromPath,
} from './openCloudAvatarCreationTokensRequests';

export function CreateAvatarCreationToken() {
  return useMutation({
    mutationKey: ['createAvatarCreationToken'],
    mutationFn: async (request: V2CloudProtos.ICreateAvatarCreationTokenRequest) => {
      try {
        await createAvatarCreationToken(request);
        return undefined;
      } catch (error) {
        if (!(error instanceof OpenCloudError)) {
          return UnknownErrorMessageKey;
        }
        const ocError = error as OpenCloudError;
        return parseError(ocError);
      }
    },
  });
}

export function useListAvatarCreationTokens(
  experienceId: number | undefined,
  isAssetType: boolean,
  itemType: Asset | BundleType,
) {
  const request: V2CloudProtos.IListAvatarCreationTokensRequest = {
    parent: `universes/${experienceId}`,
    maxPageSize: 30,
    pageToken: undefined,
    filter: isAssetType
      ? `asset_type==AssetType.${itemType}`
      : `bundle_type==BundleType.${itemType}`,
  };

  return useQuery({
    enabled: experienceId !== undefined,
    // Include isAssetType and itemType in the query key to ensure the tokens list is updated when they change
    queryKey: [`${experienceId}_listAvatarCreationTokens`, isAssetType, itemType],
    queryFn: async (): Promise<PageResponse<CreationData> | OCAvatarCreationTokenError> => {
      try {
        const data = await listAvatarCreationTokens(request);
        const tokensClientData = await Array.fromAsync(data);
        const formattedData =
          tokensClientData.map((token) => ({
            itemType: Item.AvatarCreationToken,
            name: token.displayName ?? '',
            description: token.description,
            price: Number(token.dynamicPrice?.currentPriceRobux ?? 0),
            hidePricingInfo: false,
            assetId: getTokenIdFromPath(token.path),
            isClickable: true,
            assetType: token.itemType?.assetType
              ? (getEnabledItemType(token.itemType) as Asset)
              : undefined,
            bundleType: token.itemType?.bundleType
              ? translateBundleDetailsToBundleInfoType(
                  getEnabledItemType(token.itemType) as BundleType,
                )
              : undefined,
            universeId: getUniverseIdFromPath(token.path),
          })) || [];

        return {
          items: formattedData,
        };
      } catch (e) {
        const error = parseError(e as OpenCloudError);

        // If failed due to user missing group permissions
        if (error === 'Message.MissingGroupPermission') {
          return OCAvatarCreationTokenError.UserMissingGroupPermissionsToListAvatarCreationTokens;
        }

        if (error === 'Message.AccessDenied') {
          return OCAvatarCreationTokenError.AccessDeniedToListAvatarCreationTokens;
        }

        return OCAvatarCreationTokenError.FailedToListAvatarCreationTokens;
      }
    },
  });
}

export function GetTokenDetails(request: V2CloudProtos.IGetAvatarCreationTokenRequest) {
  return useMutation({
    mutationKey: ['getTokenDetails'],
    mutationFn: async () => {
      const [token] = await getAvatarCreationToken(request);
      return token;
    },
  });
}

export function UpdateAvatarCreationToken() {
  return useMutation({
    mutationKey: ['updateAvatarCreationToken'],
    mutationFn: async (request: V2CloudProtos.IUpdateAvatarCreationTokenRequest) => {
      try {
        await updateAvatarCreationToken(request);
        return undefined;
      } catch (error) {
        if (!(error instanceof OpenCloudError)) {
          throw UnknownErrorMessageKey;
        }
        const ocError = error as OpenCloudError;
        return parseError(ocError);
      }
    },
  });
}

export function GetPricingPolicy() {
  return useMutation({
    mutationKey: ['getPricingPolicy'],
    mutationFn: async (request: V2CloudProtos.IGetAvatarCreationTokensPricingPolicyRequest) => {
      const [policy] = await getPricingPolicy(request);
      return policy;
    },
  });
}
