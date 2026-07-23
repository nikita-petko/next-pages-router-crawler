import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import type { PageResponse, PagingParameters } from '@rbx/core';
import { SortOrder } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { Button, Grid } from '@rbx/ui';
import type { PlacesItems } from '@modules/clients/universes';
import universesClient from '@modules/clients/universes';
import { Item } from '@modules/miscellaneous/common';
import ItemGridContainer from '../../common/containers/ItemGridContainer';
import type CreationData from '../../common/interfaces/CreationData';
import PlacesManagementItemCard from '../components/PlacesManagementItemCard';
import usePlacesManagementContainerStyles from './PlacesManagementContainer.styles';

export interface PlacesManagementGridContainerParameters extends PagingParameters {
  creatorTargetId: number;
  creatorTargetType: string;
  creationContext: string;
  universeId: number;
  startIndex: number;
  maxRows: number;
  enableGetOwnedPlacesByContextV2: boolean;
}

const PlacesManagementGridContainer: FunctionComponent<
  React.PropsWithChildren<PlacesManagementGridContainerParameters>
> = ({
  creatorTargetId,
  creatorTargetType,
  creationContext,
  universeId,
  startIndex,
  maxRows,
  enableGetOwnedPlacesByContextV2,
}) => {
  const {
    classes: { gridContainer, buttonStyles },
  } = usePlacesManagementContainerStyles();
  const { translate } = useTranslation();
  const router = useRouter();
  const [hasData, setHasData] = useState<boolean>(false);
  const sortOrder = SortOrder.Desc;
  const pagingParameters = useMemo(
    () => ({
      creatorTargetId,
      creatorTargetType,
      creationContext,
      universeId,
      startIndex,
      maxRows,
      enableGetOwnedPlacesByContextV2,
      sortOrder,
    }),
    [
      creationContext,
      creatorTargetId,
      creatorTargetType,
      enableGetOwnedPlacesByContextV2,
      maxRows,
      sortOrder,
      startIndex,
      universeId,
    ],
  );

  const loadPlacesByContext = useCallback(
    async (
      parameters: PlacesManagementGridContainerParameters,
    ): Promise<PageResponse<CreationData>> => {
      const currentCursor: number =
        !Number.isNaN(Number(parameters.cursor)) && parameters.cursor !== ''
          ? Number(parameters.cursor)
          : 1;
      const placesParams = {
        creatorTargetId: parameters.creatorTargetId,
        creatorTargetType: parameters.creatorTargetType,
        creationContext: parameters.creationContext,
        universeId: parameters.universeId,
        startIndex: currentCursor,
        maxRows: parameters.loadPageSize,
      };

      if (enableGetOwnedPlacesByContextV2) {
        const currentPageCursor = parameters.cursor ?? '';
        const placesParamsV2 = {
          creatorTargetId: parameters.creatorTargetId,
          creatorTargetType: parameters.creatorTargetType,
          creationContext: parameters.creationContext,
          universeId: parameters.universeId,
          nextPageToken: currentPageCursor,
          maxPageSize: parameters.loadPageSize,
        };

        const placesData = await universesClient.getOwnedPlacesByContextV2(
          undefined,
          placesParamsV2,
        );
        if (placesData.places === null || placesData.places === undefined) {
          return {
            items: [],
          };
        }

        const placesDataSinglePage = placesData.places;
        const formattedDataSinglePage =
          placesDataSinglePage.map((place) => ({
            itemType: Item.Places,
            placeId: place.placeId,
            name: place.universeName !== null ? place.universeName : '',
            universeId: place.universeId ?? 0,
            placeName: place.placeName,
            isStartPlace: place.isRootPlace,
            isClickable: false,
          })) || [];

        if (formattedDataSinglePage.length === 0) {
          return {
            items: [],
          };
        }

        return {
          items: formattedDataSinglePage ?? [],
          nextPageCursor: placesData.nextPageToken ?? undefined,
        };
      }
      const placesData = await universesClient.getOwnedPlacesByContext(undefined, placesParams);
      const placesItems = placesData?.places as PlacesItems[];

      const formattedData =
        (await Promise.all(
          placesItems.map(async (place) => ({
            itemType: Item.Places,
            placeId: place.placeId,
            name: place.universeName !== null ? place.universeName : '',
            universeId: place.universeId ?? 0,
            placeName: place.placeName,
            isStartPlace: place.isRootPlace,
            isClickable: false,
          })),
        )) || [];

      if (formattedData.length === 0) {
        return {
          items: [],
        };
      }

      const nextCursor = currentCursor + formattedData.length;
      return {
        nextPageCursor: nextCursor.toString(),
        items: formattedData ?? [],
      };
    },
    [enableGetOwnedPlacesByContextV2],
  );

  const getItemKey = useCallback((item: CreationData) => {
    return item.placeId ?? 0;
  }, []);

  const onLoad = useCallback((data: CreationData[]) => {
    setHasData(data.length >= 0);
  }, []);

  const errorContent = useMemo(() => {
    return translate('Message.NoItems', {
      itemType: translate('Label.Places'),
    });
  }, [translate]);

  const handleDoneButtonClick = useCallback(() => {
    router.push(`/dashboard/creations/experiences/${universeId}/places`);
  }, [universeId, router]);

  return (
    <Grid container item className={gridContainer}>
      <ItemGridContainer
        pagingParameters={pagingParameters}
        loadItems={loadPlacesByContext}
        getItemKey={getItemKey}
        GridItemComponent={PlacesManagementItemCard}
        errorMessage={translate('Message.LoadItemsError', {
          itemType: translate('Label.Places'),
        })}
        maxLoadPageSize={50} // AssetRegistryService API page size limit
        emptyMessage={errorContent}
        onLoad={onLoad}
      />
      {hasData && (
        <Grid item classes={{ root: buttonStyles }}>
          <Button
            data-testid='done-button'
            variant='contained'
            size='large'
            onClick={handleDoneButtonClick}>
            {translate('Button.Done')}
          </Button>
        </Grid>
      )}
    </Grid>
  );
};

export default PlacesManagementGridContainer;
