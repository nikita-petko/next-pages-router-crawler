import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import React, { FunctionComponent, useCallback, useState } from 'react';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { ErrorPage } from '@modules/miscellaneous/error';
import { StatusCodes } from '@rbx/core';
import { Asset, CreatorType, EmptyGrid } from '@modules/miscellaneous/common';
import { CircularProgress } from '@rbx/ui';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import { useGetAssetIsOpenUse } from '@modules/react-query/assetPermissions';
import { useGetIsCreatorEligibleForBeta } from '@modules/react-query/assetPermissions/assetPermissionsQueries';
import { assetToMprsAsset } from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsProvider';
import { useFetchUserCanManageCreatorStoreAsset } from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsQueries';
import { useCurrentDeveloperItem } from '../DeveloperItemProvider';
import ConfigureGenericNoDistributionContainer from '../../genericDeveloperItem/ConfigureGenericNoDistributionContainer/ConfigureGenericNoDistributionContainer';
import { TConfigureDeveloperItemProps } from '../types';
import ConfigureMediaFiatContainer from '../../media/ConfigureMediaFiatContainer/ConfigureMediaFiatContainer';
import CreatorStoreConfiguration from '../../creatorStore/components/CreatorStoreConfiguration/CreatorStoreConfiguration';
import { ASSET_ACCESS_FORM_ASSETS, EDIT_PERMISSION_ASSETS } from '../../constants';

type DeveloperItemTypeToContainerType = {
  [key: string]: FunctionComponent<React.PropsWithChildren<TConfigureDeveloperItemProps>>;
};

const DeveloperItemTypeToContainer = (): DeveloperItemTypeToContainerType => {
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

const ConfigureDeveloperItemContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { translate } = useTranslation();
  const { frontendFlags, loadingFrontendFlags } = useToolboxServiceApiProvider();

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
    frontendFlags[FrontendFlagName.FrontendFlagEnableAssetAccessControl] && // Overarching flag for AAC
    frontendFlags[FrontendFlagName.FrontendFlagEnableAssetAccessForm] &&
    ASSET_ACCESS_FORM_ASSETS.includes(developerItemDetails.type);

  // Asset Access Beta Eligibility
  const shouldCheckIfCreatorIsEligibleForBeta = userCanManageAsset && enableAssetAccessForm;
  const { data: isCreatorEligibleForBeta, isPending: isCreatorEligibleForBetaPending } =
    useGetIsCreatorEligibleForBeta(
      developerItemDetails?.creator.id ?? -1,
      developerItemDetails?.creator.type as CreatorType,
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
    loadingFrontendFlags ||
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
      ? DeveloperItemTypeToContainer()[developerItemDetails.type]
      : ConfigureGenericNoDistributionContainer;
    if (DeveloperItemContainer) {
      return (
        <DeveloperItemContainer
          developerItemDetails={developerItemDetails}
          enableAssetAccessForm={enableAssetAccessForm}
          frontendFlags={frontendFlags}
          isCreatorEligibleForAssetAccessBeta={isCreatorEligibleForAssetAccessBeta}
          onDataFetchFailed={handleDataFetchFailed}
        />
      );
    }
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  return (
    <FailureView
      buttonText={translate('Action.FailedToLoadPage')}
      message={translate('Message.FailedToLoadPage')}
      onReload={refreshData}
      title={translate('Heading.FailedToLoadPage')}
    />
  );
};

export default withTranslation(ConfigureDeveloperItemContainer, [
  TranslationNamespace.PlaceThumbnails,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Creations,
  TranslationNamespace.DeveloperItem,
  TranslationNamespace.Navigation,
  TranslationNamespace.RightsPortal,
]);
