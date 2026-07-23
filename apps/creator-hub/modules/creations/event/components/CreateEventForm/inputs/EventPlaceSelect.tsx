import React, { FunctionComponent, useState, useEffect, Fragment } from 'react';
import developClient from '@modules/clients/develop';
import { Control, Controller, UseFormGetValues, UseFormSetValue } from 'react-hook-form';
import { CircularProgress, Grid, makeStyles, MenuItem, Select } from '@rbx/ui';
import {
  RobloxApiDevelopModelsPlaceModel,
  V1UniversesUniverseIdPlacesGetSortOrderEnum,
  V1UniversesUniverseIdPlacesGetLimitEnum,
} from '@rbx/clients/develop';
import { useTranslation } from '@rbx/intl';
import { CreateEventFormType } from '../types';

type Place = Required<Omit<RobloxApiDevelopModelsPlaceModel, 'universeId'>> &
  Pick<RobloxApiDevelopModelsPlaceModel, 'universeId'>;

export type EventPlaceSelectorProps = {
  control: Control<CreateEventFormType>;
  getValues: UseFormGetValues<CreateEventFormType>;
  setValue: UseFormSetValue<CreateEventFormType>;
};

const useEventPlaceSelectStyles = makeStyles()({
  menuContainer: {
    width: '100%',
  },

  loaderContainer: {
    marginTop: 8,
  },
});

const EventPlaceSelect: FunctionComponent<EventPlaceSelectorProps> = ({ control, getValues }) => {
  const universeId = getValues('universeId') as number;

  const { translate } = useTranslation();
  const {
    classes: { menuContainer, loaderContainer },
  } = useEventPlaceSelectStyles();
  const [places, setPlaces] = useState<RobloxApiDevelopModelsPlaceModel[] | undefined>(undefined);
  const [didFetchFail, setDidFetchFail] = useState<boolean>(false);
  useEffect(() => {
    let isMounted = true;
    /* ESLint warns against using 'object' as argument type due to:
      https://github.com/microsoft/TypeScript/issues/21732

      #collaborative-tools is working a fix to have the v1UniversesUniverseIdPlacesGet API return
      a well-defined model instead of a generic object.
      https://jira.rbx.com/browse/COLLAB-785
    */
    // eslint-disable-next-line
    const isPlace = (obj: object): obj is Place => {
      const place = obj as Place;
      return place.id !== undefined && place.name !== undefined && place.description !== undefined;
    };

    const fetchedPlaces: Place[] = [];
    const recursivelyGetPlaces = async (nextPageCursor: string | undefined) => {
      if (!isMounted) {
        return;
      }

      if (nextPageCursor === undefined) {
        fetchedPlaces.sort((leftPlace, rightPlace) => {
          // Sorts undefined or empty names to the end.
          if (!leftPlace.name) {
            return 1;
          }
          if (!rightPlace.name) {
            return -1;
          }
          return leftPlace.name.localeCompare(rightPlace.name);
        });
        setPlaces(fetchedPlaces);
        return;
      }

      try {
        const results = await developClient.getPlacesOfUniverse(
          universeId,
          V1UniversesUniverseIdPlacesGetSortOrderEnum.Asc,
          V1UniversesUniverseIdPlacesGetLimitEnum.NUMBER_100,
          nextPageCursor,
        );
        if (results.data) {
          // PlaceId should never be 0.
          const filteredResults = results.data.filter(
            (result) => isPlace(result) && result.id !== 0,
          ) as Place[];
          fetchedPlaces.push(...filteredResults);
          recursivelyGetPlaces(results.nextPageCursor);
        } else {
          recursivelyGetPlaces(undefined);
        }
      } catch {
        setDidFetchFail(true);
      }
    };
    recursivelyGetPlaces('');
    return () => {
      isMounted = false;
    };
  }, [universeId]);

  return (
    <Controller
      name='placeId'
      control={control}
      render={({ field }) => (
        <Grid>
          <Select
            {...field}
            className={menuContainer}
            label={translate('Label.EEPlaceId')}
            margin='none'
            size='medium'
            value={field.value}
            onChange={field.onChange}
            variant='outlined'
            required>
            {places === undefined ? (
              <Grid container justifyContent='center'>
                <CircularProgress size={20} className={loaderContainer} />
              </Grid>
            ) : (
              places?.map((place) => (
                <MenuItem key={place.id} value={place.id ?? 0}>
                  {place.name}
                </MenuItem>
              ))
            )}
          </Select>
          {didFetchFail && <Fragment>{translate('Message.RequestFailure')}</Fragment>}
        </Grid>
      )}
    />
  );
};

export default EventPlaceSelect;
