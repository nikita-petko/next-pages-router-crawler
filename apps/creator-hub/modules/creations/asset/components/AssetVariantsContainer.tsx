import type { FunctionComponent } from 'react';
import React, { useMemo, useCallback } from 'react';
import { RobloxItemConfigurationApiAssetDetailsAssetTypeEnum } from '@rbx/client-itemconfiguration/v1';
import { CollectibleItemType } from '@rbx/client-marketplace-items-api/v1';
import type { PageResponse } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Grid, makeStyles, Typography } from '@rbx/ui';
import { Item } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  translateItemStatus,
  getDateForScheduledRelease,
  shouldHidePricing,
} from '../../avatarItem/utils/loadAvatarItemsUtils';
import useOverviewStyles from '../../common/components/Overview.styles';
import ItemCardContainer from '../../common/containers/ItemCardContainer';
import ItemGridContainer from '../../common/containers/ItemGridContainer';
import useCreationsFilters from '../../common/hooks/useCreationsFilters';
import type CreationData from '../../common/interfaces/CreationData';
import useCurrentItem from '../../itemConfiguration/hooks/useCurrentItem';
import creationsMenuManager from '../../menu/implementations/CreationsMenuManager';
import {
  DurationOptionsEnum,
  mapAssetTypeToString,
} from '../../unifiedFeeSystem/helper/UnifiedFeeSystemConstants';
import { translateAssetTypeToAsset } from '../../unifiedFeeSystem/helper/UnifiedFeeSystemHelper';

const useVariantStyles = makeStyles()(() => ({
  container: {
    padding: 8,
  },
  headerContainer: {
    marginBottom: 16,
  },
}));

const AssetVariantsContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const {
    classes: { emptyGrid },
  } = useOverviewStyles();
  const { isLoadingItem, marketplaceItemDetails } = useCurrentItem();

  const {
    classes: { container, headerContainer },
  } = useVariantStyles();
  const { translate } = useTranslation();
  const { isArchived } = useCreationsFilters();

  const loadVariants = useCallback(async (): Promise<PageResponse<CreationData>> => {
    // TODO @mryumae: durables - marketplaceItemDetails.RelatedItems will contain the MarketplaceItem information for each variant
    // For now, only contains the current item
    const variants = [marketplaceItemDetails?.item];
    let formattedData: CreationData[] = [];

    if (!variants) {
      return { nextPageCursor: undefined, items: [] };
    }

    const assetType = marketplaceItemDetails?.item?.marketplaceItemDetails?.assetDetails?.assetType;
    const translatedAssetType =
      assetType === undefined ? undefined : translateAssetTypeToAsset(assetType);
    const isDirectlyArchivable =
      translatedAssetType === undefined
        ? false
        : creationsMenuManager.isAssetTypeDirectlyArchivable(translatedAssetType);

    formattedData = variants
      .filter((item) => item !== undefined && item !== null)
      .filter((item) => item.delistingStatus?.status === (isArchived ? 1 : 2))
      .map((item) => ({
        itemType: Item.CatalogAsset,
        assetType: translatedAssetType,
        assetId: item.id,
        name: item.name,
        price: item.price !== undefined ? item.price : null,
        isDirectlyArchivable,
        isArchived,
        isClickable: true,
        created: item.createdTime,
        status: translateItemStatus(item.saleStatus, item.moderationStatus),
        isLimited2: item.collectibleItemType === CollectibleItemType.NUMBER_1,
        isDelisted: item.delistingStatus?.status === 1,
        isCreatedForBundle: item.cannotBePublishedReason === 3,
        scheduledStartDate: getDateForScheduledRelease(item.scheduledRelease?.onSaleTime),
        scheduledEndDate: getDateForScheduledRelease(item.scheduledRelease?.offSaleTime),
        bundleModerationStatus: item.moderationStatus,
        hidePricingInfo: shouldHidePricing(item.moderationStatus),
        isSellable: item.cannotBePublishedReason === 0,
        isCollectible: item.collectibleItemType !== 0,
        wearTime: DurationOptionsEnum.Permanent, // TODO @mryumae: durables - replace with item.wearTime once the BE is ready
      }));

    return { nextPageCursor: undefined, items: formattedData };
  }, [isArchived, marketplaceItemDetails]);

  const emptyState = useMemo(() => {
    return <div />;
  }, []);

  if (isLoadingItem) {
    return (
      <Grid container className={emptyGrid} justifyContent='center' alignItems='center'>
        <CircularProgress />
      </Grid>
    );
  }

  return (
    <Grid container classes={{ root: container }}>
      <Grid container item direction='column' gap={2} classes={{ root: headerContainer }}>
        <Grid item>
          <Typography color='primary' variant='h1'>
            Lorem ipsum
            {/* TODO @mryumae: replace with translation */}
          </Typography>
        </Grid>
        <Grid item>
          <Typography color='secondary' variant='body1'>
            {/* TODO @mryumae: replace with translation */}
            Lorem ipsum
          </Typography>
        </Grid>
      </Grid>
      <ItemGridContainer
        pagingParameters={{}}
        loadItems={loadVariants}
        getItemKey={(item) => (item.assetId || item.bundleId) ?? 0}
        GridItemComponent={ItemCardContainer}
        errorMessage={translate('Message.LoadItemsError', {
          itemType: translate(
            mapAssetTypeToString(
              marketplaceItemDetails?.item?.marketplaceItemDetails?.assetDetails?.assetType ??
                RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_0,
            ),
          ),
        })}
        emptyMessage={emptyState}
      />
    </Grid>
  );
};

export default withTranslation(AssetVariantsContainer, [
  TranslationNamespace.Variants,
  TranslationNamespace.Creations,
]);
