import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Avatar,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useFetchItemDetails } from '@modules/clients/ToolboxServiceQueries';
import { Asset } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import useLeftNavigationStyles from '@modules/navigation/leftNavigation/components/LeftNavigation.styles';
import useLeftNavigationStatusStyles from '@modules/navigation/leftNavigation/componentsV2/LeftNavigationStatus.styles';
import CopyTextActionMenuItem from '../../../common/components/CopyTextActionMenuItem';
import OpenLinkActionMenuItem from '../../../common/components/OpenLinkActionMenuItem';
import StatusCardContextMenu from '../../../common/components/StatusCardContextMenu';
import { useCurrentDeveloperItem } from '../DeveloperItemProvider';

const { creatorStore } = creatorHub;
const DeveloperItemStatus: FunctionComponent<React.PropsWithChildren> = () => {
  const { classes: styles } = useLeftNavigationStyles();
  const {
    classes: { fullWidth, overflowText },
  } = useLeftNavigationStatusStyles();

  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const copyMeshIdLabel = tPendingTranslation(
    'Copy Mesh ID',
    'Kebab menu action to copy a MeshPart mesh ID',
    translationKey('Action.CopyMeshID', TranslationNamespace.Creations),
  );
  const meshIdItemName = tPendingTranslation(
    'Mesh ID',
    'Item name shown in the "Copied {item}" snackbar after copying a mesh ID',
    translationKey('Label.MeshID', TranslationNamespace.Creations),
  );
  const copyTextureIdLabel = tPendingTranslation(
    'Copy Texture ID',
    'Kebab menu action to copy a Decal or MeshPart texture ID',
    translationKey('Action.CopyTextureID', TranslationNamespace.Creations),
  );
  const textureIdItemName = tPendingTranslation(
    'Texture ID',
    'Item name shown in the "Copied {item}" snackbar after copying a texture ID',
    translationKey('Label.TextureID', TranslationNamespace.Creations),
  );
  const { isLoadingDeveloperItem, developerItemDetails, developerItemImage } =
    useCurrentDeveloperItem();

  const isDecal = developerItemDetails?.type === Asset.Decal;
  const isMeshPart = developerItemDetails?.type === Asset.MeshPart;
  const { data: toolboxItemDetails } = useFetchItemDetails(
    Number(developerItemDetails?.id),
    isDecal || isMeshPart,
  );
  const toolboxAsset = toolboxItemDetails?.asset;
  const meshId = isMeshPart ? toolboxAsset?.meshId : undefined;
  const textureId = isDecal || isMeshPart ? toolboxAsset?.textureId : undefined;

  const copyAssetIdLabel = translate('Action.CopyAssetID');
  const assetIdItemName = translate('Label.AssetID');
  const openInCreatorStoreLabel = translate('Heading.OpenInCreatorStore');

  if (isLoadingDeveloperItem || !developerItemDetails) {
    return (
      <div className={styles.statusContainer}>
        <CircularProgress color='secondary' />
      </div>
    );
  }

  const menuItems = [
    <CopyTextActionMenuItem
      actionName={copyAssetIdLabel}
      itemName={assetIdItemName}
      key='copy-asset-id'
      actionKey='copyAssetId'
      textToCopy={developerItemDetails?.id}
    />,
    ...(meshId
      ? [
          <CopyTextActionMenuItem
            actionName={copyMeshIdLabel}
            itemName={meshIdItemName}
            key='copy-mesh-id'
            actionKey='copyMeshId'
            textToCopy={meshId.toString()}
          />,
        ]
      : []),
    ...(textureId
      ? [
          <CopyTextActionMenuItem
            actionName={copyTextureIdLabel}
            itemName={textureIdItemName}
            key='copy-texture-id'
            actionKey='copyTextureId'
            textToCopy={textureId.toString()}
          />,
        ]
      : []),
    <OpenLinkActionMenuItem
      key='view-on-marketplace'
      actionKey='viewOnMarketplace'
      url={creatorStore.getAssetUrl(parseInt(developerItemDetails.id, 10))}
      actionName={openInCreatorStoreLabel}
    />,
  ];

  return (
    <List disablePadding classes={{ root: fullWidth }}>
      <ListItem disableGutters>
        <ListItemAvatar>
          <Avatar variant='rounded' alt='icon'>
            {developerItemImage}
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary={developerItemDetails.name} classes={{ primary: overflowText }} />
        <ListItemSecondaryAction>
          <StatusCardContextMenu menuItems={menuItems} />
        </ListItemSecondaryAction>
      </ListItem>
    </List>
  );
};

export default DeveloperItemStatus;
