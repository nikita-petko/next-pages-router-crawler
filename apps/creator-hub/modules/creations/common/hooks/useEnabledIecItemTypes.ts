import { useQuery } from '@tanstack/react-query';
import {
  V1PermissionsItemTypesGetActionEnum,
  V1PermissionsItemTypesGetTargetTypesEnum,
} from '@rbx/client-itemconfiguration/v1';
import itemconfigurationClient from '@modules/clients/itemconfiguration';
import type { Asset } from '@modules/miscellaneous/common';
import { BundleType } from '../../avatarItem/constants/avatarItemConstants';
import getBundleTypeToBundleTypeString from '../../unifiedFeeSystem/helper/unifiedFeeSystemBundleMapping';

export type TItemTypeMetadata = {
  displayName: string;
};

const fetchEnabledItemTypes = async () => {
  const allowedAssetTypes = await itemconfigurationClient.getAllowedAssetTypes(
    V1PermissionsItemTypesGetActionEnum.NUMBER_3, // IecCreation
    [
      V1PermissionsItemTypesGetTargetTypesEnum.NUMBER_0,
      V1PermissionsItemTypesGetTargetTypesEnum.NUMBER_1,
    ],
  );

  const enabledItemTypes = new Set<Asset | BundleType>();
  const enabledItemTypesMetadata: { [key: string]: TItemTypeMetadata } = {};

  allowedAssetTypes.allowedAssetTypes?.forEach((assetType) => {
    let parsedAssetType = assetType;

    // Tshirt is returned from the BE as TshirtAccessory, but we need to use TShirtAccessory
    if (parsedAssetType === 'TshirtAccessory') {
      parsedAssetType = 'TShirtAccessory';
    }

    enabledItemTypes.add(parsedAssetType as Asset);
    enabledItemTypesMetadata[parsedAssetType] = {
      displayName: `Label.${parsedAssetType}`,
    };
  });

  allowedAssetTypes.allowedBundleTypes?.forEach((bundleType) => {
    const bundleTypeEnum = getBundleTypeToBundleTypeString(bundleType);
    enabledItemTypes.add(bundleTypeEnum);
    enabledItemTypesMetadata[bundleTypeEnum] = {
      displayName: `Label.${bundleType}`,
    };
  });

  return { enabledItemTypes, enabledItemTypesMetadata };
};

function useEnabledIecItemTypes() {
  const { data, error, isLoading, isFetching } = useQuery({
    queryKey: ['enabledItemTypes'],
    queryFn: fetchEnabledItemTypes,
    staleTime: 10000, // 10 seconds
    retry: 1,
  });

  if (error) {
    return {
      error,
      enabledItemTypes: new Set([BundleType.Body]),
      enabledItemTypesMetadata: {
        [BundleType.Body]: { displayName: 'Label.Body' },
      } as { [key: string]: TItemTypeMetadata },
      isFetched: true,
      isFetching,
    };
  }

  return {
    error,
    enabledItemTypes: data?.enabledItemTypes ?? new Set(),
    enabledItemTypesMetadata: data?.enabledItemTypesMetadata ?? {},
    isFetched: !isLoading,
    isFetching,
  };
}

export default useEnabledIecItemTypes;
