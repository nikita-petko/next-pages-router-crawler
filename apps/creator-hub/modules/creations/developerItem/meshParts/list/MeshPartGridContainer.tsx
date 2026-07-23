import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo } from 'react';
import type { V1CreationsGetAssetsGetLimitEnum } from '@rbx/client-itemconfiguration/v1';
import type { PageResponse, PagingParameters } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import { Asset } from '@modules/miscellaneous/common';
import CreationsGridEmptyState from '../../../common/components/CreationsGridEmptyState/CreationsGridEmptyState';
import ItemGridContainer from '../../../common/containers/ItemGridContainer';
import useCreationsFilters from '../../../common/hooks/useCreationsFilters';
import useCreationsGridContainerStyles from '../../../home/containers/CreationsGridContainer.styles';
import creationsMenuManager from '../../../menu/implementations/CreationsMenuManager';
import OpenStudioButton from '../../common/list/openStudioButton/OpenStudioButton';
import {
  developerItemGridLoadPageSize,
  loadDeveloperItemToolboxIds,
} from '../../common/list/utils/loadDeveloperItemToolboxIds';
import utils from '../../common/list/utils/utils';
import type { TMeshPartListItem } from '../types';
import MeshPartItems from './items/MeshPartItems';

export type TMeshPartGridContainerProps = {
  groupId?: number;
};

type TMeshPartPagingParameters = Omit<PagingParameters, 'count'> & {
  count?: V1CreationsGetAssetsGetLimitEnum;
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
      loadPageSize: developerItemGridLoadPageSize,
    }),
    [isArchived, isOnMarketplace, groupId],
  );
  const loadAssets = useCallback(
    async (parameters: TMeshPartPagingParameters): Promise<PageResponse<TMeshPartListItem>> =>
      utils.loadAssetFactory<TMeshPartListItem>(async (assetIds) => {
        const { data, toolboxIdsByAssetId } = await loadDeveloperItemToolboxIds(assetIds);
        return data.reduce<TMeshPartListItem[]>((previousValue, item) => {
          if (typeof item.id === 'undefined' || typeof item.name === 'undefined') {
            return previousValue;
          }
          const itemOnMarketplace = item.isCopyingAllowed ?? false;
          // Only filter when `On Marketplace` filter is on
          if (parameters.isOnMarketplace && itemOnMarketplace !== parameters.isOnMarketplace) {
            return previousValue;
          }
          const toolboxIds = toolboxIdsByAssetId.get(item.id);
          previousValue.push({
            assetType: meshPartAssetType,
            assetId: item.id,
            name: item.name,
            created: item.created ?? null,
            isArchivable: true,
            isArchived: parameters.isArchived,
            isOnMarketplace: itemOnMarketplace,
            meshId: toolboxIds?.meshId ?? null,
            textureId: toolboxIds?.textureId ?? null,
          });
          return previousValue;
        }, []);
      })(
        meshPartAssetType, // assetType
        parameters.isArchived, // isArchived
        parameters.groupId, // groupId
        parameters.count, // limit
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
