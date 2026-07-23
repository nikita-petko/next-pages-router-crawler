import React, { FunctionComponent, useCallback } from 'react';
import { ItemDetails } from '@modules/creations/common/interfaces/ItemDetails';
import { Typography } from '@rbx/ui';
import ItemCardTitle from '@modules/creations/common/components/ItemCardTitle';
import { useTranslation } from '@rbx/intl';
import ItemMetaWithLoading from '@modules/creations/developerItem/common/list/itemMetaWithLoading/ItemMetaWithLoading';
import ItemMetaCreatedDate from '@modules/creations/developerItem/common/list/itemMetaCreatedDate/ItemMetaCreatedDate';
import GridItemContainer, {
  TMenuNodesFactory,
} from '../../../common/list/gridItemContainer/GridItemContainer';
import CopyBaseMenuItem from '../../../common/list/menuItems/CopyBaseMenuItem/CopyBaseMenuItem';
import { TMeshPartListItem } from '../../types';
import OpenAssetDetails from '../../../common/list/menuItems/OpenAssetDetails/OpenAssetDetails';
import ArchiveOperations from '../../../common/list/menuItems/ArchiveOperation/ArchiveOperations';
import useGridItemStyles from '../../../common/list/menuItems/useGridItemStyles';

export type TMeshPartItemsProps = ItemDetails<TMeshPartListItem>;

const MeshPartItems: FunctionComponent<React.PropsWithChildren<TMeshPartItemsProps>> = ({
  item,
  isLoading,
  removeItem,
}) => {
  const {
    classes: { meta },
  } = useGridItemStyles();
  const { translate } = useTranslation();

  const menuNodesFactory = useCallback<TMenuNodesFactory>(
    (setMenuOpen) => {
      const nodes = [
        [
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
        ],
      ];
      if (item.isArchivable) {
        nodes.push([
          <ArchiveOperations
            assetId={item.assetId}
            isArchived={item.isArchived}
            key='archive'
            onRemove={removeItem}
          />,
        ]);
      }
      return nodes;
    },
    [item.assetId, item.isArchivable, item.isArchived, removeItem, translate],
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
            {translate('Label.OnCreatorStore')}
          </Typography>
        </ItemMetaWithLoading>
      )}
    </GridItemContainer>
  );
};

export default MeshPartItems;
