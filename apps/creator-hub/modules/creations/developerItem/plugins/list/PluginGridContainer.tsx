import React, { FunctionComponent, useCallback, useMemo } from 'react';
// eslint-disable-next-line no-restricted-imports -- deep import into creations module; will be resolved when creations barrel is removed (Phase 5)
import useCreationsGridContainerStyles from '@modules/creations/home/containers/CreationsGridContainer.styles';
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

import { toolboxServiceItemDetailsLimit } from '@modules/clients';
import utils from '../../common/list/utils/utils';
import PluginItems from './items/PluginItems';
import OpenStudioButton from '../../common/list/openStudioButton/OpenStudioButton';
import { TCreatorStoreListItem } from '../../common';

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
