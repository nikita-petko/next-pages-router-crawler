import React, { FunctionComponent, useMemo, useState, useCallback, useEffect } from 'react';
import { Thumbnail2d } from '@rbx/thumbnails';
import {
  itemTypeToThumbnailType,
  assetTypeToItemType,
  Asset,
  itemTypeToReturnPolicyType,
  urls,
} from '@modules/miscellaneous/common';
import {
  Avatar,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useLeftNavigationStyles from '@modules/navigation/leftNavigation/components/LeftNavigation.styles';
import useLeftNavigationStatusStyles from '@modules/navigation/leftNavigation/componentsV2/LeftNavigationStatus.styles';
import { GetAppealStatusResponse, CreateContentMetadataAppealRequest } from '@modules/clients';
import itemConfigurationClient from '@modules/clients/itemconfiguration';
import { RobloxItemConfigurationApiAssetDetailsAssetTypeEnum } from '@rbx/client-itemconfiguration/v1';
import OpenLinkActionMenuItem from '../../common/components/OpenLinkActionMenuItem';
import CopyTextActionMenuItem from '../../common/components/CopyTextActionMenuItem';
import StatusCardContextMenu from '../../common/components/StatusCardContextMenu';
import ContentMetadataAppealDialog from '../../itemConfiguration/components/ContentMetadataAppealDialog';
import useCurrentItem from '../../itemConfiguration/hooks/useCurrentItem';
import {
  BodySuitDisplayName,
  mapAssetTypeToString,
} from '../../unifiedFeeSystem/helper/UnifiedFeeSystemConstants';

const AssetStatus: FunctionComponent<React.PropsWithChildren<object>> = () => {
  const { classes: styles } = useLeftNavigationStyles();
  const {
    classes: { fullWidth, overflowText },
  } = useLeftNavigationStatusStyles();
  const { translate } = useTranslation();
  const { isLoadingItem, collectiblesMetadata, refreshItemDetails, marketplaceItemDetails } =
    useCurrentItem();

  // Content Metadata Appeals
  const [showContentMetadataAppealDialog, setShowContentMetadataAppealDialog] = useState(false);
  const [priceFloorDisplayName, setPriceFloorDisplayName] = useState<string>('');

  const assetTypeNumber =
    marketplaceItemDetails?.item?.marketplaceItemDetails?.assetDetails?.assetType ??
    RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_0;
  const assetType = mapAssetTypeToString(assetTypeNumber) as Asset;
  const assetId = marketplaceItemDetails?.item?.id
    ? Number(marketplaceItemDetails.item.id)
    : undefined;
  const name = marketplaceItemDetails?.item?.name ?? '';

  const isAssetTypeEligibleForAppeal = useMemo(() => {
    if (!assetType || !collectiblesMetadata?.bodysuitEligibleAssetTypes) {
      return false;
    }

    if (!assetTypeNumber) {
      return false;
    }

    return collectiblesMetadata.bodysuitEligibleAssetTypes.includes(assetTypeNumber);
  }, [assetType, collectiblesMetadata?.bodysuitEligibleAssetTypes, assetTypeNumber]);

  // Correct bodysuit detection using price floor display name
  const isBodySuit = useMemo(() => {
    return priceFloorDisplayName === BodySuitDisplayName;
  }, [priceFloorDisplayName]);

  // Fetch price floor data to determine bodysuit status
  useEffect(() => {
    const fetchPriceFloor = async () => {
      if (!assetId || !collectiblesMetadata?.isGetPriceFloorEnabled) {
        return;
      }

      try {
        const priceFloorResponse = await itemConfigurationClient.getPriceFloor(
          assetId,
          false, // isBundle
          false, // isLimited (we can determine this if needed)
        );
        setPriceFloorDisplayName(priceFloorResponse?.displayName ?? '');
      } catch {
        // Fallback to empty string if API fails
        setPriceFloorDisplayName('');
      }
    };

    fetchPriceFloor();
  }, [collectiblesMetadata?.isGetPriceFloorEnabled, assetId]);

  // Refresh asset details when component mounts to ensure bodysuit status is up-to-date
  useEffect(() => {
    if (refreshItemDetails) {
      refreshItemDetails();
    }
  }, [assetId, refreshItemDetails]);

  const handleFetchAppealStatus = useCallback(
    async (itemId: string): Promise<GetAppealStatusResponse> => {
      const targetType = 0;

      try {
        const response = await itemConfigurationClient.getContentMetadataAppealStatus(
          targetType,
          itemId,
          1,
        );
        return response;
      } catch (error) {
        const httpError = error as { status?: number };

        if (httpError?.status === 404) {
          return {
            appealStatus: 0,
            canAppeal: false,
          } as GetAppealStatusResponse;
        }
        throw error;
      }
    },
    [],
  );

  const handleSubmitAppeal = useCallback(async (itemId: string): Promise<void> => {
    try {
      const appealRequest: CreateContentMetadataAppealRequest = {
        targetType: 0,
        targetId: itemId,
        appealType: 1,
      };

      await itemConfigurationClient.createContentMetadataAppeal(appealRequest);
    } catch (error) {
      const httpError = error as { status?: number };

      if (httpError?.status === 404) {
        throw new Error('Could not submit recategorization request: API endpoint not available');
      }

      // Re-throw with more context if it's a generic error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to submit recategorization request: ${errorMessage}`);
    }
  }, []);

  const handleFetchCategory = useCallback(
    async (itemId: string): Promise<void> => {
      if (!collectiblesMetadata?.isGetPriceFloorEnabled) {
        return;
      }

      const assetIdNum = Number(itemId);
      if (!Number.isInteger(assetIdNum) || assetIdNum <= 0) {
        return;
      }

      try {
        const priceFloorResponse = await itemConfigurationClient.getPriceFloor(
          assetIdNum,
          false,
          false,
        );
        const displayName = priceFloorResponse?.displayName ?? '';
        setPriceFloorDisplayName(displayName);
      } catch {
        // keep existing display name if request fails
      }
    },
    [collectiblesMetadata?.isGetPriceFloorEnabled],
  );

  const showContentRecategorizationButton =
    collectiblesMetadata?.isContentMetadataAppealEnabled && isAssetTypeEligibleForAppeal;

  if (isLoadingItem || marketplaceItemDetails == null) {
    return (
      <Button className={styles.statusContainer} disabled>
        <CircularProgress color='secondary' />
      </Button>
    );
  }

  const itemType = assetTypeToItemType[assetType as Asset];

  const menuItems = [
    <CopyTextActionMenuItem
      actionName={translate('Action.CopyAssetID')}
      itemName={translate('Label.AssetID')}
      key='copy-asset-id'
      actionKey='copyAssetId'
      textToCopy={assetId?.toString()}
    />,
  ];

  if (showContentRecategorizationButton) {
    menuItems.push(
      <MenuItem
        key='content-recategorization'
        onClick={() => setShowContentMetadataAppealDialog(true)}>
        {translate('Action.CategoryReview')}
      </MenuItem>,
    );
  }

  menuItems.push(
    <OpenLinkActionMenuItem
      key='view-on-marketplace'
      actionKey='viewOnMarketplace'
      url={urls.www.getCatalogUrl(assetId ?? 0)}
      actionName={translate('Heading.OpenOnRoblox')}
    />,
  );

  return (
    <React.Fragment>
      <List disablePadding classes={{ root: fullWidth }}>
        <ListItem disableGutters>
          <ListItemAvatar>
            <Avatar variant='rounded' alt='icon'>
              <Thumbnail2d
                targetId={assetId ?? 0}
                type={itemTypeToThumbnailType[itemType]}
                alt={name ?? ''}
                returnPolicy={itemTypeToReturnPolicyType[itemType]}
              />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary={name} classes={{ primary: overflowText }} />
          <ListItemSecondaryAction>
            <StatusCardContextMenu menuItems={menuItems} />
          </ListItemSecondaryAction>
        </ListItem>
      </List>

      {collectiblesMetadata?.isContentMetadataAppealEnabled && isAssetTypeEligibleForAppeal && (
        <ContentMetadataAppealDialog
          showContentMetadataAppealDialog={showContentMetadataAppealDialog}
          setShowContentMetadataAppealDialog={setShowContentMetadataAppealDialog}
          itemId={assetId?.toString() || ''}
          isBodySuit={isBodySuit}
          onFetchAppealStatus={handleFetchAppealStatus}
          onSubmitAppeal={handleSubmitAppeal}
          onFetchCategory={handleFetchCategory}
        />
      )}
    </React.Fragment>
  );
};

export default AssetStatus;
