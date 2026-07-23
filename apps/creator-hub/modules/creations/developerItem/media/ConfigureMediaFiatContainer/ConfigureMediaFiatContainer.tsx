import { EmptyGrid } from '@modules/miscellaneous/common';
import { CircularProgress } from '@rbx/ui';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import {
  assetToMprsAsset,
  useMarketplacePublishingRequirementsProvider,
} from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsProvider';
import type { AssetConfigurationRestrictions } from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsProvider';
import {
  assetToProduct,
  useMarketplaceFiatServiceProvider,
} from '@modules/marketplaceFiatService/MarketplaceFiatServiceProvider';
import { CreatorStoreProduct } from '@modules/clients/creatorStoreProduct/openCloudCreatorStoreProduct';
import { useCurrentDeveloperItem } from '../../common';
import { TConfigureDeveloperItemProps } from '../../common/types';
import ConfigureMediaFiatForm from '../ConfigureMediaFiatForm/ConfigureMediaFiatForm';

const ConfigureMediaFiatContainer: FunctionComponent<
  React.PropsWithChildren<TConfigureDeveloperItemProps>
> = ({
  developerItemDetails,
  enableAssetAccessForm,
  frontendFlags,
  isCreatorEligibleForAssetAccessBeta,
  onDataFetchFailed,
}) => {
  const { type: assetType } = developerItemDetails;
  const { refreshDeveloperItemDetails } = useCurrentDeveloperItem();
  const [isPageInitializing, setIsPageInitializing] = useState<boolean>(true);
  const [isOnMarketplace, setIsOnMarketplace] = useState<boolean>(false);
  const [assetConfigurationRestrictions, setAssetConfigurationRestrictions] =
    useState<AssetConfigurationRestrictions>();
  const { fetchAssetConfigurationRestrictions } = useMarketplacePublishingRequirementsProvider();
  const { fetchProduct } = useMarketplaceFiatServiceProvider();

  const loadVerificationAndFiatStatus = useCallback(
    async (assetId: string) => {
      try {
        return fetchAssetConfigurationRestrictions(
          assetToMprsAsset(assetType),
          parseInt(assetId, 10),
        );
      } catch {
        const errorMsg = `Failed to fetch asset configuration restrictions for asset ${assetId}`;
        // eslint-disable-next-line no-console -- TODO: Add relevant description
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [assetType, fetchAssetConfigurationRestrictions],
  );

  const loadFiatProduct = useCallback(
    async (assetId: string) => {
      try {
        return fetchProduct(assetId, assetToProduct(assetType));
      } catch {
        const errorMsg = `Failed to fetch fiat product for asset ${assetId}`;
        // eslint-disable-next-line no-console -- TODO: Add relevant description
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [assetType, fetchProduct],
  );

  const fetchData = useCallback(async () => {
    try {
      if (developerItemDetails) {
        const requests = [
          loadVerificationAndFiatStatus(developerItemDetails.id),
          loadFiatProduct(developerItemDetails.id),
        ];
        const results = await Promise.all(requests);
        const assetConfigurationRestrictionsResponse = results[0] as AssetConfigurationRestrictions;
        const fiatProduct = results[1] as CreatorStoreProduct;
        if (!assetConfigurationRestrictionsResponse) {
          throw new Error(
            `Something went wrong fetching asset configuration restrictions for ${developerItemDetails.id}`,
          );
        }
        if (
          !fiatProduct ||
          fiatProduct.purchasable === undefined ||
          fiatProduct.purchasable === null
        ) {
          throw new Error(
            `Something went wrong fetching fiat product for ${developerItemDetails.id}`,
          );
        }
        setAssetConfigurationRestrictions(assetConfigurationRestrictionsResponse);
        setIsOnMarketplace(fiatProduct.purchasable);
      }
    } catch {
      if (onDataFetchFailed) {
        onDataFetchFailed();
      }
    } finally {
      setIsPageInitializing(false);
    }
  }, [developerItemDetails, loadFiatProduct, loadVerificationAndFiatStatus, onDataFetchFailed]);

  const refreshData = async () => {
    refreshDeveloperItemDetails();
    fetchData();
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: Add relevant description
  }, []);

  if (isPageInitializing) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  if (developerItemDetails && assetConfigurationRestrictions) {
    return (
      <ConfigureMediaFiatForm
        assetConfigurationRestrictions={assetConfigurationRestrictions}
        assetType={assetType}
        developerItemDetails={developerItemDetails}
        enableAssetAccessForm={enableAssetAccessForm}
        frontendFlags={frontendFlags}
        isCreatorEligibleForAssetAccessBeta={isCreatorEligibleForAssetAccessBeta}
        isOnMarketplace={isOnMarketplace}
        refreshData={refreshData}
      />
    );
  }

  return (
    <EmptyGrid>
      <CircularProgress />
    </EmptyGrid>
  );
};

export default ConfigureMediaFiatContainer;
