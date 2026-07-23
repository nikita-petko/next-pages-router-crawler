import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
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
import UploadAssetButton from '../../common/list/uploadAssetButton/UploadAssetButton';
import {
  developerItemGridLoadPageSize,
  loadDeveloperItemToolboxIds,
} from '../../common/list/utils/loadDeveloperItemToolboxIds';
import utils from '../../common/list/utils/utils';
import type { TDecalListItem } from '../types';
import DecalItems from './items/DecalItems';

export type TDecalGridContainerProps = {
  groupId?: number;
};

type TDecalPagingParameters = Omit<PagingParameters, 'count'> & {
  count?: V1CreationsGetAssetsGetLimitEnum;
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
      loadPageSize: developerItemGridLoadPageSize,
    }),
    [isArchived, groupId, isOnMarketplace],
  );

  const loadAssets = useCallback(
    async (parameters: TDecalPagingParameters): Promise<PageResponse<TDecalListItem>> =>
      utils.loadAssetFactory<TDecalListItem>(async (assetIds) => {
        const { data, toolboxIdsByAssetId } = await loadDeveloperItemToolboxIds(assetIds);
        return data.reduce<TDecalListItem[]>((previousValue, item) => {
          if (typeof item.id === 'undefined' || typeof item.name === 'undefined') {
            return previousValue;
          }
          const itemOnMarketplace = item.isCopyingAllowed ?? false;
          // Only filter when `On Marketplace` filter is on
          if (parameters.isOnMarketplace && itemOnMarketplace !== parameters.isOnMarketplace) {
            return previousValue;
          }
          previousValue.push({
            assetType: decalAssetType,
            assetId: item.id,
            name: item.name,
            isArchived: parameters.isArchived,
            created: item.created ?? null,
            isOnMarketplace: itemOnMarketplace,
            isArchivable: true,
            textureId: toolboxIdsByAssetId.get(item.id)?.textureId ?? null,
          });
          return previousValue;
        }, []);
      })(
        decalAssetType, // assetType
        parameters.isArchived, // isArchived
        parameters.groupId, // groupId
        parameters.count, // limit
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
