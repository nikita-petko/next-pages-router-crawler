import React, { FunctionComponent, useCallback, useMemo } from 'react';
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
import { TMeshPartListItem } from '../types';
import MeshPartItems from './items/MeshPartItems';
import OpenStudioButton from '../../common/list/openStudioButton/OpenStudioButton';

export type TMeshPartGridContainerProps = {
  groupId?: number;
};

type TMeshPartPagingParameters = PagingParameters & {
  isOnMarketplace: boolean;
  isArchived: boolean;
  groupId?: number;
};

const meshPartAssetType = Asset.MeshPart;

const MeshPartGridContainer: FunctionComponent<
  React.PropsWithChildren<TMeshPartGridContainerProps>
> = ({ groupId }) => {
  const {
    classes: { gridContainer },
  } = useCreationsGridContainerStyles();
  const { isOnMarketplace, isArchived } = useCreationsFilters();
  const { translate } = useTranslation();
  const pagingParameters: TMeshPartPagingParameters = useMemo(
    () => ({
      cursor: '',
      groupId,
      isArchived,
      isOnMarketplace,
    }),
    [isArchived, isOnMarketplace, groupId],
  );
  const loadAssets = useCallback(
    async (parameters: TMeshPartPagingParameters): Promise<PageResponse<TMeshPartListItem>> =>
      utils.loadDevItemFunctionDefaultFactory<TMeshPartListItem>((previousValue, item) => {
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
            assetType: meshPartAssetType,
            assetId: item.id,
            name: item.name,
            created: item.created || null,
            isArchivable: item.isArchivable || true,
            isArchived: parameters.isArchived,
            isOnMarketplace: itemOnMarketplace,
          },
        ];
      })(
        meshPartAssetType, // assetType
        parameters.isArchived, // isArchived
        parameters.groupId, // groupId
        parameters.count as V1CreationsGetAssetsGetLimitEnum, // limit
        parameters.cursor, // cursor
      ),
    [],
  );

  return (
    <Grid container item className={gridContainer}>
      <ItemGridContainer
        GridItemComponent={MeshPartItems}
        errorMessage={translate('Message.LoadItemsError', {
          itemType: translate(creationsMenuManager.getAssetFullNameKey(meshPartAssetType)),
        })}
        emptyMessage={
          <CreationsGridEmptyState assetType={meshPartAssetType}>
            <OpenStudioButton />
          </CreationsGridEmptyState>
        }
        getItemKey={(item) => item.assetId ?? 0}
        loadItems={loadAssets}
        pagingParameters={pagingParameters}
      />
    </Grid>
  );
};

export default MeshPartGridContainer;
