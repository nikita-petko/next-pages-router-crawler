import React, { FunctionComponent, useCallback } from 'react';
import { ItemDetails } from '@modules/creations/common/interfaces/ItemDetails';
import { Typography } from '@rbx/ui';
import ItemCardTitle from '@modules/creations/common/components/ItemCardTitle';
import { useTranslation } from '@rbx/intl';
import ItemMetaCreatedDate from '@modules/creations/developerItem/common/list/itemMetaCreatedDate/ItemMetaCreatedDate';
import ArchiveOperations from '@modules/creations/developerItem/common/list/menuItems/ArchiveOperation/ArchiveOperations';
import GridItemContainer, {
  TMenuNodesFactory,
} from '../../../common/list/gridItemContainer/GridItemContainer';
import CopyBaseMenuItem from '../../../common/list/menuItems/CopyBaseMenuItem/CopyBaseMenuItem';
import { TPrimitiveListItem } from '../../types';
import ItemMetaWithLoading from '../../../common/list/itemMetaWithLoading/ItemMetaWithLoading';
import OpenAssetDetails from '../../../common/list/menuItems/OpenAssetDetails/OpenAssetDetails';
import useGridItemStyle from '../../../common/list/menuItems/useGridItemStyles';

export type TPrimitiveItemsProps = ItemDetails<TPrimitiveListItem>;

const PrimitiveItems: FunctionComponent<React.PropsWithChildren<TPrimitiveItemsProps>> = ({
  item,
  isLoading,
  removeItem,
}) => {
  const {
    classes: { meta },
  } = useGridItemStyle();
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
            key='copy-asset-id'
            actionName={translate('Action.CopyAssetID')}
            textToCopy={item.assetId.toString()}
            onCloseMenu={() => setMenuOpen(false)}
            itemName={translate('Label.AssetID')}
            actionKey='CopyAssetID'
          />,
        ],
      ];
      if (item.isArchivable) {
        nodes.push([
          <ArchiveOperations
            key='archive'
            isArchived={item.isArchived}
            assetId={item.assetId}
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

export default PrimitiveItems;
