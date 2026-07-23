import React, { FunctionComponent, useCallback, useMemo, useState } from 'react';
import { ArrowForwardIcon, Button, Grid, Typography } from '@rbx/ui';
import { creationsMenuManager } from '@modules/creations/menu';
import { PageResponse, PagingParameters } from '@rbx/core';
import { Asset } from '@modules/miscellaneous/common';
import { useTranslation } from '@rbx/intl';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import {
  ItemGridContainer,
  useCreationsFilters,
  CreationsGridEmptyState,
} from '@modules/creations/common';
import { V1CreationsGetAssetsGetLimitEnum } from '@rbx/client-itemconfiguration/v1';
import { Flex } from '@modules/miscellaneous/common/components';
import utils from '../../common/list/utils/utils';
import { PrimitiveAssetType, TPrimitiveListItem } from '../types';
import PrimitiveItems from './items/PrimitiveItems';
import usePrimitiveGridContainerStyles from './PrimitiveGridContainer.styles';

export type TPrimitiveGridContainerProps = {
  primitiveAssetType: PrimitiveAssetType;
  groupId?: number;
};

type TPrimitivePagingParameters = PagingParameters & {
  isArchived: boolean;
  groupId?: number;
};

const PrimitiveGridContainer: FunctionComponent<
  React.PropsWithChildren<TPrimitiveGridContainerProps>
> = ({ primitiveAssetType, groupId }) => {
  const {
    classes: {
      goToParentAssetTypeCallToActionContainer,
      goToParentAssetTypeCallToActionText,
      gridContainer,
    },
  } = usePrimitiveGridContainerStyles();
  const [, setQueryParams] = useQueryParams(['activeTab']);
  const [isEmpty, setIsEmpty] = useState(false);
  const { isArchived } = useCreationsFilters();
  const { translate } = useTranslation();

  const pagingParameters: TPrimitivePagingParameters = useMemo(
    () => ({
      isArchived,
      groupId,
      cursor: '',
    }),
    [isArchived, groupId],
  );

  const goToParentAssetTypeButton = useMemo(() => {
    let parentAssetType;
    let goToParentAssetTypeText;
    switch (primitiveAssetType) {
      case Asset.Mesh:
        parentAssetType = Asset.MeshPart;
        goToParentAssetTypeText = 'Action.GoToMeshParts';
        break;
      case Asset.Image:
        parentAssetType = Asset.Decal;
        goToParentAssetTypeText = 'Action.GoToDecals';
        break;
      default:
        throw new Error('Unsupported asset type');
    }

    const handleGoToParentAssetTypeButtonClick = () => {
      setQueryParams({ activeTab: parentAssetType });
    };

    return (
      <Button
        data-testid='go-to-parent-button'
        color='primary'
        variant='contained'
        onClick={handleGoToParentAssetTypeButtonClick}>
        <span>{translate(goToParentAssetTypeText)}&nbsp;</span>
        <ArrowForwardIcon />
      </Button>
    );
  }, [primitiveAssetType, translate, setQueryParams]);

  const goToParentAssetTypeCallToAction = useMemo(() => {
    let emptyStateDescription;
    switch (primitiveAssetType) {
      case Asset.Mesh:
        emptyStateDescription = 'Description.EmptyStateMeshes';
        break;
      case Asset.Image:
        emptyStateDescription = 'Description.EmptyStateImages';
        break;
      default:
        throw new Error('Unsupported asset type');
    }

    return (
      <Flex flexDirection='column' alignItems='center'>
        <Typography
          className={goToParentAssetTypeCallToActionText}
          color='secondary'
          textAlign='center'>
          {translate(emptyStateDescription)}
        </Typography>
        {goToParentAssetTypeButton}
      </Flex>
    );
  }, [
    primitiveAssetType,
    goToParentAssetTypeCallToActionText,
    translate,
    goToParentAssetTypeButton,
  ]);

  const loadAssets = useCallback(
    async (parameters: TPrimitivePagingParameters): Promise<PageResponse<TPrimitiveListItem>> =>
      utils.loadDevItemFunctionDefaultFactory<TPrimitiveListItem>((previousValue, item) => {
        if (typeof item.id === 'undefined' || typeof item.name === 'undefined') {
          return previousValue;
        }
        return [
          ...previousValue,
          {
            assetType: primitiveAssetType,
            assetId: item.id,
            name: item.name,
            created: item.created || null,
            isArchivable: item.isArchivable || false,
            isArchived: parameters.isArchived,
            isOnMarketplace: item.isCopyingAllowed || false,
          },
        ];
      })(
        primitiveAssetType, // assetType
        parameters.isArchived, // isArchived
        parameters.groupId, // groupId
        parameters.count as V1CreationsGetAssetsGetLimitEnum, // limit
        parameters.cursor, // cursor
      ),
    [primitiveAssetType],
  );
  return (
    <Grid container item className={gridContainer}>
      {/* If the grid is not empty, show the call to action to go to the parent asset type in small format. 
      If the grid is empty, this will be handled via the emptyMessage handling of the ItemGridContainer. */}
      {!isEmpty && (
        <Grid item className={goToParentAssetTypeCallToActionContainer}>
          {goToParentAssetTypeCallToAction}
        </Grid>
      )}
      <ItemGridContainer
        pagingParameters={pagingParameters}
        loadItems={loadAssets}
        getItemKey={(item) => item.assetId ?? 0}
        GridItemComponent={PrimitiveItems}
        errorMessage={translate('Message.LoadItemsError', {
          itemType: translate(creationsMenuManager.getAssetFullNameKey(primitiveAssetType)),
        })}
        emptyMessage={
          <CreationsGridEmptyState assetType={primitiveAssetType}>
            {goToParentAssetTypeButton}
          </CreationsGridEmptyState>
        }
        onFirstPageLoad={setIsEmpty}
      />
    </Grid>
  );
};

export default PrimitiveGridContainer;
