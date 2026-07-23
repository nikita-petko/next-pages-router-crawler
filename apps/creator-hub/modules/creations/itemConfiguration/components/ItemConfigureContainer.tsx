import React, { FunctionComponent, useCallback } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CircularProgress, Grid } from '@rbx/ui';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { useRouter } from 'next/router';
import { RobloxItemConfigurationApiAssetDetailsAssetTypeEnum } from '@rbx/client-itemconfiguration/v1';
import { useOverviewStyles } from '../../common';
import useCurrentItem from '../hooks/useCurrentItem';
import UnifiedFeeSystemContainer from '../../unifiedFeeSystem/components/UnifiedFeeSystemContainer';
import { mapAssetTypeToString } from '../../unifiedFeeSystem/helper/UnifiedFeeSystemConstants';

const ItemConfigureContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const {
    classes: { emptyGrid },
  } = useOverviewStyles();
  const { isLoadingItem, collectiblesMetadata, marketplaceItemDetails } = useCurrentItem();
  const { translate } = useTranslation();
  const router = useRouter();

  const handleReload = useCallback(() => {
    router.reload();
  }, [router]);

  if (isLoadingItem) {
    return (
      <Grid container className={emptyGrid} justifyContent='center' alignItems='center'>
        <CircularProgress />
      </Grid>
    );
  }

  if (!marketplaceItemDetails || !collectiblesMetadata) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={handleReload}
      />
    );
  }

  const assetType = mapAssetTypeToString(
    marketplaceItemDetails.item?.marketplaceItemDetails?.assetDetails?.assetType ||
      RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_0,
  );
  const is2dAsset = assetType === 'TShirt' || assetType === 'Shirt' || assetType === 'Pants';

  return (
    <Grid container justifyContent='space-between' alignItems='center'>
      <UnifiedFeeSystemContainer
        itemDetails={marketplaceItemDetails ?? undefined}
        isBundle={!!marketplaceItemDetails?.item?.marketplaceItemDetails?.bundleDetails}
        collectiblesMetadata={collectiblesMetadata}
        is2dAsset={is2dAsset}
      />
    </Grid>
  );
};

export default withTranslation(ItemConfigureContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Places,
  TranslationNamespace.AssetTypes,
]);
