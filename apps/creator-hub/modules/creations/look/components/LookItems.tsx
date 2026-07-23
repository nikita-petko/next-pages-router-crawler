import React, { useCallback, useMemo } from 'react';
import type { RobloxItemConfigurationApiGetItemResponse } from '@rbx/client-itemconfiguration/v1';
import {
  RobloxItemConfigurationApiAssetCreationsDetailsResponseStatusEnum,
  RobloxItemConfigurationApiAssetDetailsAssetTypeEnum,
  RobloxItemConfigurationApiBundleDetailsBundleTypeEnum,
} from '@rbx/client-itemconfiguration/v1';
import type { LookItemDetailV2 } from '@rbx/client-look-api/v1';
import { NoPriceStatus } from '@rbx/client-look-api/v1';
import type { PageResponse } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { Grid, makeStyles, Typography, Divider } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import itemconfigurationClient from '@modules/clients/itemconfiguration';
import { Item } from '@modules/miscellaneous/common';
import { isValidEnumValue } from '@modules/miscellaneous/utils';
import { translateItemStatus } from '../../avatarItem/utils/loadAvatarItemsUtils';
import ItemCardContainer from '../../common/containers/ItemCardContainer';
import ItemGridContainer from '../../common/containers/ItemGridContainer';
import type CreationData from '../../common/interfaces/CreationData';
import {
  translateAssetTypeToAsset,
  translateBundleDetailsToBundleInfoType,
} from '../../unifiedFeeSystem/helper/UnifiedFeeSystemHelper';

interface LookItemsProps {
  items: LookItemDetailV2[];
  creatingUniverseId?: number | null;
}

const EMPTY_PAGING_PARAMS = {};

const useStyles = makeStyles()((theme) => ({
  description: {
    color: theme.palette.content.muted,
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
    assetType:
      item.assetType != null &&
      isValidEnumValue(RobloxItemConfigurationApiAssetDetailsAssetTypeEnum, item.assetType)
        ? translateAssetTypeToAsset(item.assetType)
        : undefined,
    bundleId: isBundle ? item.id : undefined,
    bundleType:
      item.bundleType != null &&
      isValidEnumValue(RobloxItemConfigurationApiBundleDetailsBundleTypeEnum, item.bundleType)
        ? translateBundleDetailsToBundleInfoType(item.bundleType)
        : undefined,
    name: item.name ?? undefined,
    price: item.priceInRobux,
    isClickable: true,
    creatorName: item.creator?.name ?? undefined,
    userId: item.creator?.id,
    isSellable: true,
    status,
    isDelisted,
    isIEC,
  };
};

function LookItems(props: LookItemsProps) {
  const { items, creatingUniverseId } = props;
  const { classes: styles } = useStyles();
  const { translate } = useTranslation();
  const { user } = useAuthentication();
  // IEC looks always have non-purchasable component items by design; surfacing
  // them as "Unavailable" mis-frames an expected state as a problem.
  const isIecLook = creatingUniverseId != null && creatingUniverseId > 0;

  const { availableItems, unavailableItems } = useMemo(() => {
    const available: LookItemDetailV2[] = [];
    const unavailable: LookItemDetailV2[] = [];

    items.forEach((item) => {
      // For IEC looks every component item is intentionally non-purchasable
      // (private template assets), so the "unavailable" split doesn't apply
      // — keep all items in the regular list.
      if (!isIecLook && item.isPurchasable === false) {
        unavailable.push(item);
      } else {
        available.push(item);
      }
    });

    return { availableItems: available, unavailableItems: unavailable };
  }, [items, isIecLook]);

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
    <div>
      <Typography variant='h5' style={{ fontSize: '24px', fontWeight: '450' }}>
        {translate('Heading.LookDetails')}
      </Typography>
      <Grid container item XSmall={12} rowGap={2} id='look-items' style={{ marginTop: '32px' }}>
        <Grid item XSmall={12} Large={5} style={{ paddingRight: '20px' }}>
          <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
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
              getItemKey={(item) => item.assetId ?? item.bundleId ?? item.lookId ?? 0}
              GridItemComponent={ItemCardContainer}
              errorMessage={translate('Message.LoadItemsError', {
                itemType: translate('Label.Items'),
              })}
              emptyMessage={translate('Message.NoItemsFound')}
            />
          </Grid>
        )}
        {unavailableItems.length > 0 && (
          <>
            <Grid item XSmall={12}>
              <Divider style={{ maxWidth: '60%', marginLeft: 'auto' }} />
            </Grid>
            <Grid item XSmall={12} className={styles.unavailableItems}>
              <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
                {translate('Label.UnavailableItems')}
              </Typography>
              <Typography variant='body2' className={styles.description}>
                {translate('Message.UnavailableItemsDescription')}
              </Typography>
            </Grid>
            <Grid item XSmall={12} Large={7} style={{ marginLeft: 'auto' }}>
              <ItemGridContainer
                pagingParameters={EMPTY_PAGING_PARAMS}
                loadItems={loadUnavailableItems}
                getItemKey={(item) => item.assetId ?? item.bundleId ?? item.lookId ?? 0}
                GridItemComponent={ItemCardContainer}
                errorMessage={translate('Message.LoadItemsError', {
                  itemType: translate('Label.Items'),
                })}
                emptyMessage={translate('Message.NoItemsFound')}
              />
            </Grid>
          </>
        )}
      </Grid>
    </div>
  );
}

export default LookItems;
