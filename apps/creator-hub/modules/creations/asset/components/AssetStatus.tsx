import type { FunctionComponent } from 'react';
import React, { useEffect } from 'react';
import { RobloxItemConfigurationApiAssetDetailsAssetTypeEnum } from '@rbx/client-itemconfiguration/v1';
import { useTranslation } from '@rbx/intl';
import { Thumbnail2d } from '@rbx/thumbnails';
import {
  Avatar,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
} from '@rbx/ui';
import type { Asset } from '@modules/miscellaneous/common';
import {
  itemTypeToThumbnailType,
  assetTypeToItemType,
  itemTypeToReturnPolicyType,
} from '@modules/miscellaneous/common';
import { www } from '@modules/miscellaneous/urls';
import useLeftNavigationStyles from '@modules/navigation/leftNavigation/components/LeftNavigation.styles';
import useLeftNavigationStatusStyles from '@modules/navigation/leftNavigation/componentsV2/LeftNavigationStatus.styles';
import CopyTextActionMenuItem from '../../common/components/CopyTextActionMenuItem';
import OpenLinkActionMenuItem from '../../common/components/OpenLinkActionMenuItem';
import StatusCardContextMenu from '../../common/components/StatusCardContextMenu';
import useCurrentItem from '../../itemConfiguration/hooks/useCurrentItem';
import { mapAssetTypeToString } from '../../unifiedFeeSystem/helper/UnifiedFeeSystemConstants';

const AssetStatus: FunctionComponent<React.PropsWithChildren<object>> = () => {
  const { classes: styles } = useLeftNavigationStyles();
  const {
    classes: { fullWidth, overflowText },
  } = useLeftNavigationStatusStyles();
  const { translate } = useTranslation();
  const { isLoadingItem, refreshItemDetails, marketplaceItemDetails } = useCurrentItem();

  const assetTypeNumber =
    marketplaceItemDetails?.item?.marketplaceItemDetails?.assetDetails?.assetType ??
    RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_0;
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- mapAssetTypeToString yields Asset keys used downstream
  const assetType = mapAssetTypeToString(assetTypeNumber) as Asset;
  const assetId = marketplaceItemDetails?.item?.id
    ? Number(marketplaceItemDetails.item.id)
    : undefined;
  const name = marketplaceItemDetails?.item?.name ?? '';

  // Refresh asset details when component mounts to ensure status is up-to-date
  useEffect(() => {
    if (refreshItemDetails) {
      refreshItemDetails();
    }
  }, [assetId, refreshItemDetails]);

  if (isLoadingItem || marketplaceItemDetails == null) {
    return (
      <Button className={styles.statusContainer} disabled>
        <CircularProgress color='secondary' />
      </Button>
    );
  }

  const itemType = assetTypeToItemType[assetType];

  const menuItems = [
    <CopyTextActionMenuItem
      actionName={translate('Action.CopyAssetID')}
      itemName={translate('Label.AssetID')}
      key='copy-asset-id'
      actionKey='copyAssetId'
      textToCopy={assetId?.toString()}
    />,
    <OpenLinkActionMenuItem
      key='view-on-marketplace'
      actionKey='viewOnMarketplace'
      url={www.getCatalogUrl(assetId ?? 0)}
      actionName={translate('Heading.OpenOnRoblox')}
    />,
  ];

  return (
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
  );
};

export default AssetStatus;
