import React, { FunctionComponent, useCallback, useMemo, useState } from 'react';
import { Button, Grid } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { PageResponse, PagingParameters } from '@rbx/core';
import { developClient } from '@modules/clients';
import {
  RobloxApiDevelopModelsPlaceModel,
  V1UniversesUniverseIdPlacesGetLimitEnum,
  V1UniversesUniverseIdPlacesGetSortOrderEnum,
} from '@rbx/clients/develop';
import { Item } from '@modules/miscellaneous/common';
import { creationsMenuManager } from '@modules/creations/menu';
import { useRouter } from 'next/router';
import {
  CreationData,
  ItemCardContainer,
  ItemGridContainer,
  ItemGridEmptyView,
} from '../../common';
import usePlacesGridContainerStyles from './PlacesGridContainer.styles';
import usePublicPublishAllowed from '../hooks/usePublicPublishAllowed';

export interface PlacesGridContainerPagingParameters extends PagingParameters {
  universeId: number;
  rootplaceId?: number;
  itemType: Item;
}

export interface PlacesGridContainerProps {
  universeId: number;
  rootplaceId?: number;
  itemType: Item;
}

type Place = Required<Omit<RobloxApiDevelopModelsPlaceModel, 'universeId'>> &
  Pick<RobloxApiDevelopModelsPlaceModel, 'universeId'>;

async function loadPlaceItems(
  parameters: PlacesGridContainerPagingParameters,
): Promise<PageResponse<CreationData>> {
  const placeItemsParams = parameters;

  const isValidPlace = (obj: unknown): obj is Place => {
    const place = obj as Place;
    return place.id !== undefined && place.name !== undefined && place.description !== undefined;
  };

  const { nextPageCursor, data: placesData } = await developClient.getPlacesOfUniverse(
    placeItemsParams.universeId,
    V1UniversesUniverseIdPlacesGetSortOrderEnum.Asc,
    V1UniversesUniverseIdPlacesGetLimitEnum.NUMBER_100,
    placeItemsParams.cursor ?? '',
  );
  const filteredResults = placesData?.filter(
    (place) => isValidPlace(place) && place.id !== 0,
  ) as Place[];

  const formattedData =
    filteredResults
      ?.map((place) => ({
        itemType: placeItemsParams.itemType,
        placeId: place.id,
        universeId: place.universeId,
        name: place.name,
        description: place.description,
        isClickable: true,
        isStartPlace: placeItemsParams.rootplaceId === place.id,
      }))
      .sort((a, b) => Number(b.isStartPlace) - Number(a.isStartPlace)) || [];

  return { nextPageCursor, items: formattedData };
}

const PlacesGridContainer: FunctionComponent<React.PropsWithChildren<PlacesGridContainerProps>> = ({
  universeId,
  rootplaceId,
  itemType,
}) => {
  const {
    classes: { buttonStyles },
  } = usePlacesGridContainerStyles();
  const { translate } = useTranslation();
  const [hasData, setHasData] = useState(false);
  const router = useRouter();

  const { isPublicPublishAllowed, isPublicExperience } = usePublicPublishAllowed();
  const isAddPlaceDisabled = isPublicExperience && !isPublicPublishAllowed;

  const handleButtonClick = useCallback(() => {
    router.push(`/dashboard/creations/experiences/${universeId}/places/manage`);
  }, [router, universeId]);

  const emptyContent = useMemo(() => {
    return (
      <ItemGridEmptyView
        emptyMessage={translate('Message.EmptyMessage', {
          itemType: translate(creationsMenuManager.getItemFullNameKey(itemType)),
        })}
      />
    );
  }, [itemType, translate]);

  const onLoad = useCallback((data: CreationData[]) => {
    setHasData(data.length >= 0);
  }, []);

  const pagingParameters = useMemo(() => {
    return { universeId, itemType, rootplaceId };
  }, [itemType, rootplaceId, universeId]);

  return (
    <Grid container direction='column'>
      {hasData && (
        <Grid item classes={{ root: buttonStyles }}>
          <Button
            data-testid='addplace-button-testid'
            variant='contained'
            size='large'
            disabled={isAddPlaceDisabled ?? false}
            onClick={handleButtonClick}>
            {translate('Button.AddAPlace')}
          </Button>
        </Grid>
      )}
      <ItemGridContainer
        pagingParameters={pagingParameters}
        loadItems={loadPlaceItems}
        getItemKey={(item) => item.placeId ?? 0}
        GridItemComponent={ItemCardContainer}
        errorMessage={translate('Message.LoadItemsError', {
          itemType: translate('Label.Places'),
        })}
        emptyMessage={emptyContent}
        onLoad={onLoad}
      />
    </Grid>
  );
};

export default PlacesGridContainer;
