import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import type { RobloxApiDevelopModelsPlaceModel } from '@rbx/client-develop/v1';
import {
  V1UniversesUniverseIdPlacesGetLimitEnum,
  V1UniversesUniverseIdPlacesGetSortOrderEnum,
} from '@rbx/client-develop/v1';
import type { PageResponse, PagingParameters } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { Button, Grid } from '@rbx/ui';
import developClient from '@modules/clients/develop';
import type { Item } from '@modules/miscellaneous/common';
import ItemGridEmptyView from '../../common/components/ItemGridEmptyView/ItemGridEmptyView';
import ItemCardContainer from '../../common/containers/ItemCardContainer';
import ItemGridContainer from '../../common/containers/ItemGridContainer';
import type CreationData from '../../common/interfaces/CreationData';
import creationsMenuManager from '../../menu/implementations/CreationsMenuManager';
import usePublicPublishAllowed from '../hooks/usePublicPublishAllowed';
import usePlacesGridContainerStyles from './PlacesGridContainer.styles';

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
