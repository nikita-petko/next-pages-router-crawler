import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ItemCardTitle from '../../../../common/components/ItemCardTitle';
import type { ItemDetails } from '../../../../common/interfaces/ItemDetails';
import type { TMenuNodesFactory } from '../../../common/list/gridItemContainer/GridItemContainer';
import GridItemContainer from '../../../common/list/gridItemContainer/GridItemContainer';
import ItemMetaCreatedDate from '../../../common/list/itemMetaCreatedDate/ItemMetaCreatedDate';
import ItemMetaWithLoading from '../../../common/list/itemMetaWithLoading/ItemMetaWithLoading';
import ArchiveOperations from '../../../common/list/menuItems/ArchiveOperation/ArchiveOperations';
import CopyBaseMenuItem from '../../../common/list/menuItems/CopyBaseMenuItem/CopyBaseMenuItem';
import OpenAssetDetails from '../../../common/list/menuItems/OpenAssetDetails/OpenAssetDetails';
import useGridItemStyles from '../../../common/list/menuItems/useGridItemStyles';
import type { TMeshPartListItem } from '../../types';

export type TMeshPartItemsProps = ItemDetails<TMeshPartListItem>;

const MeshPartItems: FunctionComponent<React.PropsWithChildren<TMeshPartItemsProps>> = ({
  item,
  isLoading,
  removeItem,
}) => {
  const {
    classes: { meta },
  } = useGridItemStyles();
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
  const onCreatorStoreLabel = translate('Label.OnCreatorStore');

  const menuNodesFactory = useCallback<TMenuNodesFactory>(
    (setMenuOpen) => {
      const firstGroup = [
        <OpenAssetDetails
          key='open-asset-detail'
          assetId={item.assetId}
          onCloseMenu={() => setMenuOpen(false)}
        />,
        <CopyBaseMenuItem
          actionKey='CopyAssetID'
          actionName={translate('Action.CopyAssetID')}
          itemName={translate('Label.AssetID')}
          key='copy-asset-id'
          onCloseMenu={() => setMenuOpen(false)}
          textToCopy={item.assetId.toString()}
        />,
        ...(item.meshId
          ? [
              <CopyBaseMenuItem
                actionKey='CopyMeshID'
                actionName={copyMeshIdLabel}
                itemName={meshIdItemName}
                key='copy-mesh-id'
                onCloseMenu={() => setMenuOpen(false)}
                textToCopy={item.meshId.toString()}
              />,
            ]
          : []),
        ...(item.textureId
          ? [
              <CopyBaseMenuItem
                actionKey='CopyTextureID'
                actionName={copyTextureIdLabel}
                itemName={textureIdItemName}
                key='copy-texture-id'
                onCloseMenu={() => setMenuOpen(false)}
                textToCopy={item.textureId.toString()}
              />,
            ]
          : []),
      ];
      return [
        firstGroup,
        ...(item.isArchivable
          ? [
              [
                <ArchiveOperations
                  assetId={item.assetId}
                  isArchived={item.isArchived}
                  key='archive'
                  onRemove={removeItem}
                />,
              ],
            ]
          : []),
      ];
    },
    [
      item.assetId,
      item.isArchivable,
      item.isArchived,
      item.meshId,
      item.textureId,
      removeItem,
      translate,
      copyMeshIdLabel,
      meshIdItemName,
      copyTextureIdLabel,
      textureIdItemName,
    ],
  );

  return (
    <GridItemContainer assetId={item.assetId} menuNodesFactory={menuNodesFactory}>
      <div className={meta}>
        <ItemCardTitle name={item.name} isLoading={isLoading} />
      </div>
      {item.created && (
        <ItemMetaWithLoading isLoading={isLoading} width='80%'>
          <ItemMetaCreatedDate time={item.created} />
        </ItemMetaWithLoading>
      )}
      {item.isOnMarketplace && (
        <ItemMetaWithLoading isLoading={isLoading} width='80%'>
          <Typography variant='body2' color='secondary' noWrap>
            {onCreatorStoreLabel}
          </Typography>
        </ItemMetaWithLoading>
      )}
    </GridItemContainer>
  );
};

export default MeshPartItems;
