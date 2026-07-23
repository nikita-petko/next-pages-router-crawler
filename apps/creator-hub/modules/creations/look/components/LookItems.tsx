import React, { useCallback, useMemo } from 'react';
import { Grid, makeStyles, Typography, Divider } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { LookItemDetailV2, NoPriceStatus } from '@rbx/clients/lookApi';
import { PageResponse } from '@rbx/core';
import { Item } from '@modules/miscellaneous/common';
import {
  RobloxItemConfigurationApiAssetCreationsDetailsResponseStatusEnum,
  RobloxItemConfigurationApiAssetDetailsAssetTypeEnum,
  RobloxItemConfigurationApiBundleDetailsBundleTypeEnum,
  RobloxItemConfigurationApiGetItemResponse,
} from '@rbx/client-itemconfiguration/v1';
import { itemconfigurationClient } from '@modules/clients';
import { useAuthentication } from '@modules/authentication/providers';
import { translateItemStatus } from '../../avatarItem/utils/loadAvatarItemsUtils';
import { ItemCardContainer, CreationData } from '../../common';
import ItemGridContainer from '../../common/containers/ItemGridContainer';
import {
  translateAssetTypeToAsset,
  translateBundleDetailsToBundleInfoType,
} from '../../unifiedFeeSystem/helper/UnifiedFeeSystemHelper';

interface LookItemsProps {
  items: LookItemDetailV2[];
}

const EMPTY_PAGING_PARAMS = {};

const useStyles = makeStyles()(() => ({
  description: {
    color: '#CBCBCB',
  },
  unavailableItems: {
    maxWidth: '60%',
    marginLeft: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
}));

const convertItemToCreationData = async (
  item: LookItemDetailV2,
  userId: number,
): Promise<CreationData> => {
  const isBundle = item.bundleType !== null;
  const itemType = isBundle ? Item.Bundle : Item.CatalogAsset;

  let response: RobloxItemConfigurationApiGetItemResponse | null = null;

  if (userId === item.creator?.id) {
    try {
      response = await itemconfigurationClient.getItem(isBundle, item.id?.toString() ?? '');
    } catch {
      response = null;
    }
  }

  let status: RobloxItemConfigurationApiAssetCreationsDetailsResponseStatusEnum | undefined;
  let isDelisted: boolean | undefined;
  let isIEC: boolean | undefined;
  if (response) {
    status = translateItemStatus(response.item?.saleStatus, response.item?.moderationStatus);
    isDelisted = response.item?.delistingStatus?.status === 1;
    isIEC = response.item?.cannotBePublishedReason === 2;
  } else if (item.isPurchasable === false) {
    if (item.noPriceStatus === NoPriceStatus.OffSale) {
      status = RobloxItemConfigurationApiAssetCreationsDetailsResponseStatusEnum.OffSale;
    } else if (item.noPriceStatus === NoPriceStatus.InExperience) {
      isIEC = true;
    }
  }

  if (
    item.isPurchasable === false &&
    status === undefined &&
    isDelisted === undefined &&
    isIEC === undefined
  ) {
    status = RobloxItemConfigurationApiAssetCreationsDetailsResponseStatusEnum.Unknown;
  }

  return {
    itemType,
    assetId: isBundle ? undefined : item.id,
    assetType: translateAssetTypeToAsset(
      item.assetType as RobloxItemConfigurationApiAssetDetailsAssetTypeEnum,
    ),
    bundleId: isBundle ? item.id : undefined,
    bundleType: translateBundleDetailsToBundleInfoType(
      item.bundleType as RobloxItemConfigurationApiBundleDetailsBundleTypeEnum,
    ),
    name: item.name,
    price: item.priceInRobux,
    isClickable: true,
    creatorName: item.creator?.name,
    userId: item.creator?.id,
    isCreatedForBundle: item.assetsInBundle,
    isSellable: true,
    status,
    isDelisted,
    isIEC,
  } as CreationData;
};

function LookItems(props: LookItemsProps) {
  const { items } = props;
  const { classes: styles } = useStyles();
  const { translate } = useTranslation();
  const { user } = useAuthentication();

  const { availableItems, unavailableItems } = useMemo(() => {
    const available: LookItemDetailV2[] = [];
    const unavailable: LookItemDetailV2[] = [];

    items.forEach((item) => {
      if (item.isPurchasable === false) {
        unavailable.push(item);
      } else {
        available.push(item);
      }
    });

    return { availableItems: available, unavailableItems: unavailable };
  }, [items]);

  const loadAvailableItems = useCallback(async (): Promise<PageResponse<CreationData>> => {
    const convertedItems = await Promise.all(
      availableItems.map((item) => convertItemToCreationData(item, user?.id ?? 0)),
    );
    return {
      items: convertedItems,
    };
  }, [availableItems, user?.id]);

  const loadUnavailableItems = useCallback(async (): Promise<PageResponse<CreationData>> => {
    const convertedItems = await Promise.all(
      unavailableItems.map((item) => convertItemToCreationData(item, user?.id ?? 0)),
    );
    return {
      items: convertedItems,
    };
  }, [unavailableItems, user?.id]);

  return (
    <Grid container item XSmall={12} rowGap={2} id='look-items' style={{ marginTop: '32px' }}>
      <Grid item XSmall={12} Large={5} style={{ paddingRight: '20px' }}>
        <Typography variant='h6'>
          {translate('Label.ItemsInThisLook', { count: items.length.toString() })}
        </Typography>
        <br />
        <Typography variant='body2' className={styles.description}>
          {translate('Message.ItemsInThisLookDescription')}{' '}
        </Typography>
      </Grid>
      {availableItems.length > 0 && (
        <Grid item XSmall={12} Large={7}>
          <ItemGridContainer
            pagingParameters={EMPTY_PAGING_PARAMS}
            loadItems={loadAvailableItems}
            getItemKey={(item) => (item.assetId || item.bundleId || item.lookId) ?? 0}
            GridItemComponent={ItemCardContainer}
            errorMessage={translate('Message.LoadItemsError', {
              itemType: translate('Label.Items'),
            })}
            emptyMessage={translate('Message.NoItemsFound')}
          />
        </Grid>
      )}
      {unavailableItems.length > 0 && (
        <React.Fragment>
          <Grid item XSmall={12}>
            <Divider style={{ maxWidth: '60%', marginLeft: 'auto' }} />
          </Grid>
          <Grid item XSmall={12} className={styles.unavailableItems}>
            <Typography variant='h6'>{translate('Label.UnavailableItems')}</Typography>
            <Typography variant='body2' className={styles.description}>
              {translate('Message.UnavailableItemsDescription')}
            </Typography>
          </Grid>
          <Grid item XSmall={12} Large={7} style={{ marginLeft: 'auto' }}>
            <ItemGridContainer
              pagingParameters={EMPTY_PAGING_PARAMS}
              loadItems={loadUnavailableItems}
              getItemKey={(item) => (item.assetId || item.bundleId || item.lookId) ?? 0}
              GridItemComponent={ItemCardContainer}
              errorMessage={translate('Message.LoadItemsError', {
                itemType: translate('Label.Items'),
              })}
              emptyMessage={translate('Message.NoItemsFound')}
            />
          </Grid>
        </React.Fragment>
      )}
    </Grid>
  );
}

export default LookItems;
