import React, { FunctionComponent, useCallback, useMemo, useState } from 'react';
import { Grid } from '@rbx/ui';
import { creationsMenuManager } from '@modules/creations/menu';
import { PageResponse, PagingParameters } from '@rbx/core';
import { Asset } from '@modules/miscellaneous/common';
import { useTranslation } from '@rbx/intl';
import {
  ItemGridContainer,
  useCreationsFilters,
  CreationsGridEmptyState,
} from '@modules/creations/common';
import { V1CreationsGetAssetsGetLimitEnum } from '@rbx/client-itemconfiguration/v1';
import useCreationsGridContainerStyles from '../../../home/containers/CreationsGridContainer.styles';
import utils from '../../common/list/utils/utils';
import UploadAssetButton from '../../common/list/uploadAssetButton/UploadAssetButton';
import { TDecalListItem } from '../types';
import DecalItems from './items/DecalItems';

export type TDecalGridContainerProps = {
  groupId?: number;
};

type TDecalPagingParameters = PagingParameters & {
  isOnMarketplace: boolean;
  isArchived: boolean;
  groupId?: number;
};

const decalAssetType = Asset.Decal;

const DecalGridContainer: FunctionComponent<React.PropsWithChildren<TDecalGridContainerProps>> = ({
  groupId,
}) => {
  const {
    classes: { gridContainer },
  } = useCreationsGridContainerStyles();
  const [isEmpty, setIsEmpty] = useState<boolean>(true);
  const { isOnMarketplace, isArchived } = useCreationsFilters();
  const { translate } = useTranslation();
  const pagingParameters: TDecalPagingParameters = useMemo(
    () => ({
      cursor: '',
      groupId,
      isArchived,
      isOnMarketplace,
    }),
    [isArchived, groupId, isOnMarketplace],
  );

  const loadAssets = useCallback(
    async (parameters: TDecalPagingParameters): Promise<PageResponse<TDecalListItem>> =>
      utils.loadDevItemFunctionDefaultFactory<TDecalListItem>((previousValue, item) => {
        if (typeof item.id === 'undefined' || typeof item.name === 'undefined') {
          return previousValue;
        }
        const itemOnMarketplace = item.isCopyingAllowed || false;
        // Only filter when `On Marketplace` filter is on
        if (parameters.isOnMarketplace && itemOnMarketplace !== parameters.isOnMarketplace) {
          return previousValue;
        }
        return [
          ...previousValue,
          {
            assetType: decalAssetType,
            assetId: item.id,
            name: item.name,
            isArchived: parameters.isArchived,
            created: item.created || null,
            isOnMarketplace: itemOnMarketplace,
            isArchivable: item.isArchivable || true,
          },
        ];
      })(
        decalAssetType, // assetType
        parameters.isArchived, // isArchived
        parameters.groupId, // groupId
        parameters.count as V1CreationsGetAssetsGetLimitEnum, // limit
        parameters.cursor, // cursor
      ),
    [],
  );
  return (
    <Grid container item className={gridContainer}>
      {!isEmpty && <UploadAssetButton assetType={decalAssetType} />}
      <ItemGridContainer
        pagingParameters={pagingParameters}
        loadItems={loadAssets}
        getItemKey={(item) => item.assetId ?? 0}
        GridItemComponent={DecalItems}
        errorMessage={translate('Message.LoadItemsError', {
          itemType: translate(creationsMenuManager.getAssetFullNameKey(decalAssetType)),
        })}
        emptyMessage={<CreationsGridEmptyState assetType={decalAssetType} />}
        onFirstPageLoad={setIsEmpty}
      />
    </Grid>
  );
};

export default DecalGridContainer;
