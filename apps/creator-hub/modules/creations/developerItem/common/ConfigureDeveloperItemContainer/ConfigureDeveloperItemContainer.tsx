import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import { assetToMprsAsset } from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsProvider';
import { useFetchUserCanManageCreatorStoreAsset } from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsQueries';
import { Asset, CreatorType } from '@modules/miscellaneous/common';
import { EmptyGrid } from '@modules/miscellaneous/components';
import FailureViewWithTranslation from '@modules/miscellaneous/components/FailureView/FailureView';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useGetAssetIsOpenUse } from '@modules/react-query/assetPermissions';
import { useGetIsCreatorEligibleForBeta } from '@modules/react-query/assetPermissions/assetPermissionsQueries';
import { ASSET_ACCESS_FORM_ASSETS, EDIT_PERMISSION_ASSETS } from '../../constants';
import CreatorStoreConfiguration from '../../creatorStore/components/CreatorStoreConfiguration/CreatorStoreConfiguration';
import ConfigureGenericNoDistributionContainer from '../../genericDeveloperItem/ConfigureGenericNoDistributionContainer/ConfigureGenericNoDistributionContainer';
import ConfigureMediaFiatContainer from '../../media/ConfigureMediaFiatContainer/ConfigureMediaFiatContainer';
import { useCurrentDeveloperItem } from '../DeveloperItemProvider';
import type { TConfigureDeveloperItemProps } from '../types';

type DeveloperItemTypeToContainerType = {
  [key: string]: FunctionComponent<React.PropsWithChildren<TConfigureDeveloperItemProps>>;
};

const getDeveloperItemTypeToContainer = (): DeveloperItemTypeToContainerType => {
  return {
    [Asset.Animation]: ConfigureGenericNoDistributionContainer,
    [Asset.Audio]: ConfigureMediaFiatContainer,
    [Asset.Decal]: CreatorStoreConfiguration,
    [Asset.MeshPart]: CreatorStoreConfiguration,
    [Asset.Model]: CreatorStoreConfiguration,
    [Asset.Plugin]: CreatorStoreConfiguration,
    [Asset.Video]: ConfigureMediaFiatContainer,
    [Asset.Image]: ConfigureGenericNoDistributionContainer,
    [Asset.Mesh]: ConfigureGenericNoDistributionContainer,
  };
};

const ConfigureDeveloperItemContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();

  const {
    canConfigureDeveloperItem,
    developerItemDetails,
    isLoadingDeveloperItem,
    refreshDeveloperItemDetails,
  } = useCurrentDeveloperItem();
  const assetId = developerItemDetails?.id ? parseInt(developerItemDetails.id, 10) : 0;
  const assetType = developerItemDetails?.type;
  const userCanConfigureDeveloperItem = canConfigureDeveloperItem === true;

  // Manage Asset Permissions
  // We only need to make this additional permissions call if the asset type supports sharing EDIT access
  const assetTypeRequiresManagePermissionCheck =
    assetType !== undefined && EDIT_PERMISSION_ASSETS.includes(assetType);
  const shouldCheckIfUserCanManageAsset =
    userCanConfigureDeveloperItem && assetTypeRequiresManagePermissionCheck;
  const { data: userCanManageAssetWithEditPermissions, isPending: isUserCanManageAssetLoading } =
    useFetchUserCanManageCreatorStoreAsset(
      assetToMprsAsset(assetType),
      assetId,
      shouldCheckIfUserCanManageAsset,
    );
  const userCanManageAsset =
    userCanConfigureDeveloperItem &&
    (!shouldCheckIfUserCanManageAsset || userCanManageAssetWithEditPermissions);

  // Asset Access
  const enableAssetAccessForm =
    developerItemDetails !== null &&
    userCanConfigureDeveloperItem &&
    ASSET_ACCESS_FORM_ASSETS.includes(developerItemDetails.type);

  // Asset Access Beta Eligibility
  const shouldCheckIfCreatorIsEligibleForBeta = userCanManageAsset && enableAssetAccessForm;
  const { data: isCreatorEligibleForBeta, isPending: isCreatorEligibleForBetaPending } =
    useGetIsCreatorEligibleForBeta(
      developerItemDetails?.creator.id ?? -1,
      developerItemDetails?.creator.type ?? CreatorType.User,
      shouldCheckIfCreatorIsEligibleForBeta,
    );
  const isCreatorEligibleForAssetAccessBeta = isCreatorEligibleForBeta ?? false;

  // Asset Access Status
  const { isError: isAssetOpenUseFetchFailed, isPending: isAssetOpenUseLoading } =
    useGetAssetIsOpenUse(
      assetId,
      isCreatorEligibleForAssetAccessBeta,
      enableAssetAccessForm,
      developerItemDetails?.type,
    );

  const isAssetAccessDataLoading =
    isAssetOpenUseLoading ||
    (shouldCheckIfCreatorIsEligibleForBeta && isCreatorEligibleForBetaPending);

  const [isDeveloperItemInfoFetchFailed, setIsDeveloperItemInfoFetchFailed] =
    useState<boolean>(false);

  const handleDataFetchFailed = useCallback(() => {
    setIsDeveloperItemInfoFetchFailed(true);
  }, []);

  const refreshData = useCallback(() => {
    setIsDeveloperItemInfoFetchFailed(false);
    return refreshDeveloperItemDetails();
  }, [refreshDeveloperItemDetails]);

  if (
    isLoadingDeveloperItem ||
    (shouldCheckIfUserCanManageAsset && isUserCanManageAssetLoading) ||
    (enableAssetAccessForm && isAssetAccessDataLoading)
  ) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  if (canConfigureDeveloperItem === false) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (
    developerItemDetails &&
    !isDeveloperItemInfoFetchFailed &&
    (!enableAssetAccessForm || !isAssetOpenUseFetchFailed)
  ) {
    const DeveloperItemContainer = userCanManageAsset
      ? getDeveloperItemTypeToContainer()[developerItemDetails.type]
      : ConfigureGenericNoDistributionContainer;
    if (DeveloperItemContainer) {
      return (
        <DeveloperItemContainer
          developerItemDetails={developerItemDetails}
          enableAssetAccessForm={enableAssetAccessForm}
          isCreatorEligibleForAssetAccessBeta={isCreatorEligibleForAssetAccessBeta}
          onDataFetchFailed={handleDataFetchFailed}
        />
      );
    }
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  return (
    <FailureViewWithTranslation
      buttonText={translate('Action.FailedToLoadPage')}
      message={translate('Message.FailedToLoadPage')}
      onReload={refreshData}
      title={translate('Heading.FailedToLoadPage')}
    />
  );
};

export default withTranslation(ConfigureDeveloperItemContainer, [
  TranslationNamespace.AssetUpload,
  TranslationNamespace.PlaceThumbnails,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Creations,
  TranslationNamespace.DeveloperItem,
  TranslationNamespace.Navigation,
  TranslationNamespace.RightsPortal,
  TranslationNamespace.MarketplaceOnboarding,
  TranslationNamespace.SocialLinks,
  TranslationNamespace.SocialLinksAgeVerificationUpsell,
]);
