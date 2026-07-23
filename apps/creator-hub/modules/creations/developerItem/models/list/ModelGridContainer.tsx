import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { useCreationsGridContainerStyles } from '@modules/creations/home';
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
import { useAuthentication } from '@modules/authentication/providers';
import { V1CreationsGetAssetsGetLimitEnum } from '@rbx/client-itemconfiguration/v1';
import utils from '../../common/list/utils/utils';
import { TModelListItem } from '../types';
import ModelItems from './items/ModelItems';
import OpenStudioButton from '../../common/list/openStudioButton/OpenStudioButton';

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
