import type { FC } from 'react';
import { useCallback } from 'react';
import { useRouter } from 'next/router';
import { Dropdown, Menu, MenuItem } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useUniversePlacesQuery } from './useUniversePlaces';

type AntiCheatPlaceSelectProps = {
  universeId: number;
  selectedPlaceId: number;
};

// Lets the creator pick which place the anti-cheat config applies to. The selection is
// written to the `placeId` query param (shallow routing) so it is deep-linkable and
// survives a refresh; the page reads it back to key the config query.
const AntiCheatPlaceSelect: FC<AntiCheatPlaceSelectProps> = ({ universeId, selectedPlaceId }) => {
  const router = useRouter();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const placesQuery = useUniversePlacesQuery(universeId);
  const { refetch: refetchPlaces } = placesQuery;

  const label = tPendingTranslation(
    'Place',
    'The place within an experience that anti-cheat settings are going to be applied to',
    translationKey('Label.AntiCheatPlace', TranslationNamespace.AntiCheat),
  );
  const loadingPlaceholder = tPendingTranslation(
    'Loading places...',
    "The status text that appears while a selector for an experience's places is loading",
    translationKey('Label.LoadingAntiCheatPlaces', TranslationNamespace.AntiCheat),
  );

  const handleValueChange = useCallback(
    (nextPlaceId: string) => {
      void router.push(
        { pathname: router.pathname, query: { ...router.query, placeId: nextPlaceId } },
        undefined,
        { shallow: true },
      );
    },
    [router],
  );

  const handleReloadPlaces = useCallback(() => {
    void refetchPlaces();
  }, [refetchPlaces]);

  if (placesQuery.isError) {
    return <LoadError onReload={handleReloadPlaces} />;
  }

  return (
    <Dropdown
      className='width-full'
      size='Medium'
      label={label}
      value={selectedPlaceId.toString()}
      placeholder={loadingPlaceholder}
      isDisabled={placesQuery.isLoading}
      onValueChange={handleValueChange}>
      <Menu>
        {(placesQuery.data ?? []).map((place) => (
          <MenuItem key={place.placeId} value={place.placeId.toString()} title={place.name} />
        ))}
      </Menu>
    </Dropdown>
  );
};

export default AntiCheatPlaceSelect;
