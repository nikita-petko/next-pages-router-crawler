import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo } from 'react';
import type { PageResponse, PagingParameters } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { toolboxServiceItemDetailsLimit } from '@modules/clients/toolboxService';
import { Asset } from '@modules/miscellaneous/common';
import CreationsGridEmptyState from '../../../common/components/CreationsGridEmptyState/CreationsGridEmptyState';
import ItemGridContainer from '../../../common/containers/ItemGridContainer';
import useCreationsFilters from '../../../common/hooks/useCreationsFilters';
import useCreationsGridContainerStyles from '../../../home/containers/CreationsGridContainer.styles';
import creationsMenuManager from '../../../menu/implementations/CreationsMenuManager';
import OpenStudioButton from '../../common/list/openStudioButton/OpenStudioButton';
import utils from '../../common/list/utils/utils';
import type { TCreatorStoreListItem } from '../../common/types';
import PluginItems from './items/PluginItems';

export type TPluginGridContainerProps = {
  groupId?: number;
};

type TPluginPagingParameters = PagingParameters & {
  isArchived: boolean;
  groupId?: number;
};

const pluginAssetType = Asset.Plugin;

const PluginGridContainer: FunctionComponent<
  React.PropsWithChildren<TPluginGridContainerProps>
> = ({ groupId }) => {
  const {
    classes: { gridContainer },
  } = useCreationsGridContainerStyles();
  const { isArchived } = useCreationsFilters();
  const { translate } = useTranslation();
  const { user } = useAuthentication();
  const pagingParameters: TPluginPagingParameters = useMemo(
    () => ({
      isArchived,
      groupId,
      cursor: '',
      loadPageSize: toolboxServiceItemDetailsLimit,
    }),
    [isArchived, groupId],
  );
  const loadAssets = useCallback(
    async (parameters: TPluginPagingParameters): Promise<PageResponse<TCreatorStoreListItem>> => {
      return utils.loadAssetFactoryFromToolbox(utils.loadAssetsDetailsFromToolbox, false)(
        user?.id ?? 0,
        pluginAssetType,
        parameters.groupId,
        parameters.loadPageSize,
        parameters.cursor,
      );
    },
    [user?.id],
  );
  return (
    <Grid container item className={gridContainer}>
      <ItemGridContainer
        GridItemComponent={PluginItems}
        emptyMessage={
          <CreationsGridEmptyState assetType={Asset.Plugin}>
            <OpenStudioButton />
          </CreationsGridEmptyState>
        }
        errorMessage={translate('Message.LoadItemsError', {
          itemType: translate(creationsMenuManager.getAssetFullNameKey(pluginAssetType)),
        })}
        getItemKey={(item) => item.assetId ?? 0}
        loadItems={loadAssets}
        pagingParameters={pagingParameters}
      />
    </Grid>
  );
};

export default PluginGridContainer;
