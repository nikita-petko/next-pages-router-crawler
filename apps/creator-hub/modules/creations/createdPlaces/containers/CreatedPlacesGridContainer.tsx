import React, { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  ItemCardContainer,
  CreationData,
  ItemGridContainer,
  ItemGridEmptyView,
} from '@modules/creations/common';
import { developClient } from '@modules/clients';
import {
  RobloxApiDevelopModelsPlaceModel,
  V1UniversesUniverseIdPlacesGetLimitEnum,
  V1UniversesUniverseIdPlacesGetSortOrderEnum,
} from '@rbx/clients/develop';
import { PageResponse, PagingParameters } from '@rbx/core';
import { Link, Item } from '@modules/miscellaneous/common';
import { resolveUrl } from '@rbx/env-utils';

type Place = Required<Omit<RobloxApiDevelopModelsPlaceModel, 'universeId'>> &
  Pick<RobloxApiDevelopModelsPlaceModel, 'universeId'>;

export type TCreatedPlacesGridContainer = {
  universeId: number;
};

const CreatedPlacesGridContainer = ({ universeId }: TCreatedPlacesGridContainer) => {
  const { translate, translateHTML } = useTranslation();

  const isValidPlace = (obj: unknown): obj is Place => {
    const place = obj as Place;
    return (
      place.id !== 0 &&
      place.id !== undefined &&
      place.name !== undefined &&
      place.description !== undefined
    );
  };

  const loadPlaces = useCallback(
    async (
      parameters: TCreatedPlacesGridContainer & PagingParameters,
    ): Promise<PageResponse<CreationData>> => {
      const { nextPageCursor, data: placesData } = await developClient.getPlacesOfUniverse(
        parameters.universeId,
        V1UniversesUniverseIdPlacesGetSortOrderEnum.Asc,
        V1UniversesUniverseIdPlacesGetLimitEnum.NUMBER_100,
        parameters.cursor ?? '',
        true,
      );

      const filteredResults = (placesData ?? [])?.filter((place) => isValidPlace(place)) as Place[];

      const formattedData = filteredResults.map((place) => ({
        itemType: Item.CreatedPlaces,
        placeId: place.id,
        universeId: place.universeId,
        name: place.name,
        description: place.description,
        isClickable: true,
        isStartPlace: false,
      }));

      return { nextPageCursor, items: formattedData };
    },
    [],
  );

  return (
    <ItemGridContainer
      pagingParameters={{
        universeId,
      }}
      loadItems={loadPlaces}
      getItemKey={(item: CreationData) => {
        return item.placeId ?? 0;
      }}
      GridItemComponent={ItemCardContainer}
      errorMessage={translate('Message.LoadItemsError', {
        itemType: translate('Label.Places'),
      })}
      emptyMessage={
        <ItemGridEmptyView
          emptyMessage={translateHTML('Message.EmptyCreatedPlaces', [
            {
              opening: 'apiLinkStart',
              closing: 'apiLinkEnd',
              content(chunks) {
                return (
                  <Link
                    href={resolveUrl(
                      'developerArticleRedirectCreatePlaceAsyncUrl',
                      process.env.targetEnvironment,
                      process.env.buildTarget,
                    )}
                    target='_blank'>
                    {chunks}
                  </Link>
                );
              },
            },
            {
              opening: 'docLinkStart',
              closing: 'docLinkEnd',
              content(chunks) {
                return (
                  <Link
                    href={resolveUrl(
                      'developerArticleGamesAndPlacesUrl',
                      process.env.targetEnvironment,
                      process.env.buildTarget,
                    )}
                    target='_blank'>
                    {chunks}
                  </Link>
                );
              },
            },
          ])}
        />
      }
    />
  );
};

export default CreatedPlacesGridContainer;
