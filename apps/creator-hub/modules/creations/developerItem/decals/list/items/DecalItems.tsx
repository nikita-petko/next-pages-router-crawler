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
import useGridItemStyle from '../../../common/list/menuItems/useGridItemStyles';
import type { TDecalListItem } from '../../types';

export type TDecalItemsProps = ItemDetails<TDecalListItem>;

const DecalItems: FunctionComponent<React.PropsWithChildren<TDecalItemsProps>> = ({
  item,
  isLoading,
  removeItem,
}) => {
  const {
    classes: { meta },
  } = useGridItemStyle();
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
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
          key='copy-asset-id'
          actionName={translate('Action.CopyAssetID')}
          textToCopy={item.assetId.toString()}
          onCloseMenu={() => setMenuOpen(false)}
          itemName={translate('Label.AssetID')}
          actionKey='CopyAssetID'
        />,
        ...(item.textureId
          ? [
              <CopyBaseMenuItem
                key='copy-texture-id'
                actionName={copyTextureIdLabel}
                textToCopy={item.textureId.toString()}
                onCloseMenu={() => setMenuOpen(false)}
                itemName={textureIdItemName}
                actionKey='CopyTextureID'
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
                  key='archive'
                  isArchived={item.isArchived}
                  assetId={item.assetId}
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
      item.textureId,
      removeItem,
      translate,
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

export default DecalItems;
