import React, { FunctionComponent, useCallback } from 'react';
import { ItemDetails } from '@modules/creations/common/interfaces/ItemDetails';
import { LinkIcon, Typography } from '@rbx/ui';
import ItemCardTitle from '@modules/creations/common/components/ItemCardTitle';
import { useTranslation } from '@rbx/intl';
import ItemMetaCreatedDate from '@modules/creations/developerItem/common/list/itemMetaCreatedDate/ItemMetaCreatedDate';
import { AssetSubType } from '@rbx/clients/toolboxService';
import GridItemContainer, {
  TMenuNodesFactory,
} from '../../../common/list/gridItemContainer/GridItemContainer';
import CopyBaseMenuItem from '../../../common/list/menuItems/CopyBaseMenuItem/CopyBaseMenuItem';
import { TModelListItem } from '../../types';
import OpenAssetDetails from '../../../common/list/menuItems/OpenAssetDetails/OpenAssetDetails';
import useGridItemStyles from '../../../common/list/menuItems/useGridItemStyles';
import ItemMetaWithLoading from '../../../common/list/itemMetaWithLoading/ItemMetaWithLoading';

export type TModelItemsProps = ItemDetails<TModelListItem>;

const ModelItems: FunctionComponent<React.PropsWithChildren<TModelItemsProps>> = ({
  item,
  isLoading,
}) => {
  const {
    classes: { meta, bottomRightIcon },
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
  const { assetSubTypes, creatingUniverseId, creatingUniverseName } = item;
  const bottomRightAdornment = assetSubTypes.includes(AssetSubType.Package) ? (
    <LinkIcon className={bottomRightIcon} />
  ) : null;

  const hasPublishAttribution = creatingUniverseId != null;
  const publishAttribution = hasPublishAttribution && (
    <ItemMetaWithLoading isLoading={isLoading} width='100%'>
      <Typography variant='body2' color='secondary'>
        {translate('Description.MadeInExperience', {
          experienceName: creatingUniverseName || '',
        })}
      </Typography>
    </ItemMetaWithLoading>
  );
  const created = item.created && (
    <ItemMetaWithLoading isLoading={isLoading} width='100%'>
      <ItemMetaCreatedDate time={item.created} />
    </ItemMetaWithLoading>
  );
  return (
    <GridItemContainer
      assetId={item.assetId}
      menuNodesFactory={menuNodesFactory}
      bottomRightAdornment={bottomRightAdornment}>
      <div className={meta}>
        <ItemCardTitle name={item.name} isLoading={isLoading} />
      </div>
      <span>{hasPublishAttribution ? publishAttribution : created}</span>
      {item.isOnMarketplace && (
        <ItemMetaWithLoading isLoading={isLoading} width='100%'>
          <Typography variant='body2' color='secondary' noWrap>
            {translate('Label.OnCreatorStore')}
          </Typography>
        </ItemMetaWithLoading>
      )}
    </GridItemContainer>
  );
};

export default ModelItems;
