import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import ItemCardTitle from '../../../../common/components/ItemCardTitle';
import type { ItemDetails } from '../../../../common/interfaces/ItemDetails';
import type { TMenuNodesFactory } from '../../../common/list/gridItemContainer/GridItemContainer';
import GridItemContainer from '../../../common/list/gridItemContainer/GridItemContainer';
import ItemMetaWithLoading from '../../../common/list/itemMetaWithLoading/ItemMetaWithLoading';
import CopyBaseMenuItem from '../../../common/list/menuItems/CopyBaseMenuItem/CopyBaseMenuItem';
import OpenAssetDetails from '../../../common/list/menuItems/OpenAssetDetails/OpenAssetDetails';
import useGridItemStyles from '../../../common/list/menuItems/useGridItemStyles';
import type { TCreatorStoreListItem } from '../../../common/types';

export type TPluginItemsProps = ItemDetails<TCreatorStoreListItem>;

const PluginItems: FunctionComponent<React.PropsWithChildren<TPluginItemsProps>> = ({
  item,
  isLoading,
}) => {
  const {
    classes: { meta },
  } = useGridItemStyles();
  const { translate } = useTranslation();

  const menuNodesFactory = useCallback<TMenuNodesFactory>(
    (setMenuOpen) => {
      return [
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
    },
    [item.assetId, translate],
  );
  return (
    <GridItemContainer assetId={item.assetId} menuNodesFactory={menuNodesFactory}>
      <div className={meta}>
        <ItemCardTitle name={item.name} isLoading={isLoading} />
      </div>
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

export default PluginItems;
