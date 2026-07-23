import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo } from 'react';
import type { V1CreationsGetAssetsGetLimitEnum } from '@rbx/client-itemconfiguration/v1';
import type { PageResponse, PagingParameters } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { Asset } from '@modules/miscellaneous/common';
import CreationsGridEmptyState from '../../../common/components/CreationsGridEmptyState/CreationsGridEmptyState';
import ItemGridContainer from '../../../common/containers/ItemGridContainer';
import useCreationsFilters from '../../../common/hooks/useCreationsFilters';
import useCreationsGridContainerStyles from '../../../home/containers/CreationsGridContainer.styles';
import creationsMenuManager from '../../../menu/implementations/CreationsMenuManager';
import OpenStudioButton from '../../common/list/openStudioButton/OpenStudioButton';
import utils from '../../common/list/utils/utils';
import type { TModelListItem } from '../types';
import ModelItems from './items/ModelItems';

export type TModelGridContainerProps = {
  groupId?: number;
};

type TModelPagingParameters = PagingParameters & {
  isArchived: boolean;
  groupId?: number;
  separateModelsAndPackages: boolean;
  includeSharedAssets: boolean;
};

const modelAssetType = Asset.Model;

const maxLoadPageSize = 30;

const ModelGridContainer: FunctionComponent<React.PropsWithChildren<TModelGridContainerProps>> = ({
  groupId,
}) => {
  const {
    classes: { gridContainer },
  } = useCreationsGridContainerStyles();
  const { isArchived } = useCreationsFilters();
  const { translate } = useTranslation();
  const { user } = useAuthentication();
  const pagingParameters: TModelPagingParameters = useMemo(
    () => ({
      cursor: '',
      groupId,
      isArchived,
      separateModelsAndPackages: false,
      includeSharedAssets: false,
    }),
    [isArchived, groupId],
  );
  const loadAssets = useCallback(
    async (parameters: TModelPagingParameters): Promise<PageResponse<TModelListItem>> => {
      return utils.loadModelFactoryFromToolbox<TModelListItem>(utils.loadModelsDetailsFromToolbox)(
        user?.id ?? 0,
        modelAssetType, // assetType
        parameters.groupId, // groupId
        parameters.count as V1CreationsGetAssetsGetLimitEnum, // limit
        parameters.cursor, // cursor);
        parameters.separateModelsAndPackages, // whether to exclude packages,
        parameters.includeSharedAssets, // whether to include assets shared with group
      );
    },
    [user?.id],
  );

  return (
    <Grid container item className={gridContainer}>
      <ItemGridContainer
        GridItemComponent={ModelItems}
        errorMessage={translate('Message.LoadItemsError', {
          itemType: translate(creationsMenuManager.getAssetFullNameKey(modelAssetType)),
        })}
        emptyMessage={
          <CreationsGridEmptyState assetType={modelAssetType}>
            <OpenStudioButton />
          </CreationsGridEmptyState>
        }
        getItemKey={(item) => item.assetId ?? 0}
        loadItems={loadAssets}
        pagingParameters={pagingParameters}
        maxLoadPageSize={maxLoadPageSize}
      />
    </Grid>
  );
};

export default ModelGridContainer;
