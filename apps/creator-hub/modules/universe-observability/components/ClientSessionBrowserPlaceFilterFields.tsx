import type { FC } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import FilterStringChoice, {
  BlankHandlingType,
} from '@modules/charts-generic/components/FilterStringChoice';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useSessionPlacesWithVersions, {
  EMPTY_SESSION_PLACES,
} from '../hooks/useSessionPlacesWithVersions';
import type { SessionBrowserDrawerFilters } from '../types/SessionBrowserFilters';
import {
  formatClientSessionPlaceOption,
  formatClientSessionPlaceVersion,
} from '../utils/clientSessionFormatters';
import {
  getSelectedPlaceVersionOptions,
  prunePlaceVersions,
} from '../utils/sessionBrowserPlaceFilterOptions';

export type ClientSessionBrowserPlaceFilterFieldsProps = {
  readonly universeId: number;
};

const ClientSessionBrowserPlaceFilterFields: FC<ClientSessionBrowserPlaceFilterFieldsProps> = ({
  universeId,
}) => {
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { control, setValue } = useFormContext<SessionBrowserDrawerFilters>();
  const selectedPlaceIds = useWatch({ control, name: 'placeIds' });
  const selectedPlaceVersions = useWatch({ control, name: 'placeVersions' });
  const {
    data: { places, placesById } = EMPTY_SESSION_PLACES,
    isLoading,
    isSuccess,
    error,
  } = useSessionPlacesWithVersions(universeId);

  const placeIds = useMemo(() => places.map((place) => place.placeId), [places]);
  const versionOptions = useMemo(
    () => getSelectedPlaceVersionOptions(places, selectedPlaceIds),
    [places, selectedPlaceIds],
  );

  const placeLabel = translate(
    translationKey('Label.Dimension.Place', TranslationNamespace.Analytics),
  );
  const placeVersionLabel = translate(
    translationKey('Label.Dimension.PlaceVersion', TranslationNamespace.Analytics),
  );
  const selectPlaceLabel = translate(
    translationKey('Label.SelectPlace', TranslationNamespace.Analytics),
  );
  const selectVersionLabel = translate(
    translationKey('Label.SelectVersion', TranslationNamespace.Analytics),
  );
  const selectPlaceFirstLabel = translate(
    translationKey('Label.SelectPlaceFirst', TranslationNamespace.Analytics),
  );
  const noVersionAvailableLabel = translate(
    translationKey('Label.NoVersionAvailable', TranslationNamespace.Analytics),
  );
  const placesLoadErrorLabel = tPendingTranslation(
    'Could not load places, please try again later.',
    'Error shown when session place options fail to load in the filter drawer.',
    translationKey('Description.SessionPlacesLoadFailed', TranslationNamespace.Analytics),
  );

  const formatPlaceOption = useCallback(
    (placeId: string) =>
      formatClientSessionPlaceOption(placeId, placesById, translationDependencies),
    [placesById, translationDependencies],
  );

  const formatPlaceVersionOption = useCallback(
    (placeVersion: string) =>
      formatClientSessionPlaceVersion(Number(placeVersion), translationDependencies),
    [translationDependencies],
  );

  const syncPlaceVersions = useCallback(
    (
      nextPlaceIds: readonly string[] | undefined,
      nextPlaceVersions: readonly number[] | undefined,
    ) => {
      // Pruning before the places load would drop applied versions we cannot validate yet.
      if (!isSuccess) {
        return;
      }

      const prunedPlaceVersions = prunePlaceVersions(
        nextPlaceVersions,
        getSelectedPlaceVersionOptions(places, nextPlaceIds),
      );
      const currentPlaceVersions = nextPlaceVersions ?? [];
      const didChange =
        currentPlaceVersions.length !== prunedPlaceVersions.length ||
        currentPlaceVersions.some((version, index) => version !== prunedPlaceVersions[index]);
      if (didChange) {
        setValue('placeVersions', prunedPlaceVersions);
      }
    },
    [isSuccess, places, setValue],
  );

  // Clearing every option must write `[]`, not `undefined`: react-hook-form
  // resolves an `undefined` field value back to the default the drawer was
  // reset with on open, which would re-check an already applied place.
  const handlePlaceIdsChange = useCallback(
    (nextPlaceIds: string[]) => {
      setValue('placeIds', nextPlaceIds);
      syncPlaceVersions(nextPlaceIds, selectedPlaceVersions);
    },
    [selectedPlaceVersions, setValue, syncPlaceVersions],
  );

  const handlePlaceVersionsChange = useCallback(
    (nextPlaceVersions: string[]) => {
      setValue('placeVersions', nextPlaceVersions.map(Number).filter(Number.isInteger));
    },
    [setValue],
  );

  useEffect(() => {
    syncPlaceVersions(selectedPlaceIds, selectedPlaceVersions);
  }, [selectedPlaceIds, selectedPlaceVersions, syncPlaceVersions]);

  const hasSelectedPlace = (selectedPlaceIds?.length ?? 0) > 0;
  const versionDisabledTooltip = hasSelectedPlace ? noVersionAvailableLabel : selectPlaceFirstLabel;

  return (
    <div className='grid gap-small width-full large:[grid-template-columns:repeat(2,minmax(0,1fr))]'>
      <div className='min-width-0'>
        <Controller
          name='placeIds'
          control={control}
          render={({ field }) => (
            <FilterStringChoice
              size='small'
              label={placeLabel}
              multiple
              isLoading={isLoading}
              selectedOptions={[...(field.value ?? [])]}
              options={placeIds}
              formatOption={formatPlaceOption}
              showOptionIdAsDescription
              blankHandling={{ type: BlankHandlingType.Value, value: selectPlaceLabel }}
              helperText={error ? placesLoadErrorLabel : undefined}
              onChange={handlePlaceIdsChange}
            />
          )}
        />
      </div>
      <div className='min-width-0'>
        <Controller
          name='placeVersions'
          control={control}
          render={({ field }) => (
            <FilterStringChoice
              size='small'
              label={placeVersionLabel}
              multiple
              isLoading={isLoading}
              selectedOptions={(field.value ?? []).map(String)}
              options={versionOptions}
              formatOption={formatPlaceVersionOption}
              blankHandling={{ type: BlankHandlingType.Value, value: selectVersionLabel }}
              tooltipOnDisabled={versionDisabledTooltip}
              onChange={handlePlaceVersionsChange}
            />
          )}
        />
      </div>
    </div>
  );
};

export default ClientSessionBrowserPlaceFilterFields;
