import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import FilterChip from '@modules/charts-generic/components/FilterChip';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useSessionPlacesWithVersions, {
  EMPTY_SESSION_PLACES,
} from '../hooks/useSessionPlacesWithVersions';
import type { SessionBrowserFilters } from '../types/SessionBrowserFilters';
import {
  formatClientSessionPlaceOption,
  formatClientSessionPlaceVersion,
} from '../utils/clientSessionFormatters';
import {
  clearSessionBrowserFilterChip,
  getSessionBrowserFilterChipDescriptors,
  type SessionBrowserFilterChipKey,
} from '../utils/sessionBrowserFilterChips';

export type ClientSessionBrowserFilterChipsProps = {
  readonly universeId: number;
  readonly filters: SessionBrowserFilters;
  readonly onChange: (filters: SessionBrowserFilters) => void;
};

const ClientSessionBrowserFilterChips: FC<ClientSessionBrowserFilterChipsProps> = ({
  universeId,
  filters,
  onChange,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { data: { placesById } = EMPTY_SESSION_PLACES } = useSessionPlacesWithVersions(universeId);

  const placeLabel = translate(
    translationKey('Label.Dimension.Place', TranslationNamespace.Analytics),
  );
  const placeVersionLabel = translate(
    translationKey('Label.Dimension.PlaceVersion', TranslationNamespace.Analytics),
  );

  const formatPlaceIds = useCallback(
    (placeIds: readonly string[]) =>
      placeIds
        .map((placeId) =>
          formatClientSessionPlaceOption(placeId, placesById, translationDependencies),
        )
        .join(', '),
    [placesById, translationDependencies],
  );

  const formatPlaceVersions = useCallback(
    (placeVersions: readonly number[]) =>
      placeVersions
        .map((placeVersion) =>
          formatClientSessionPlaceVersion(placeVersion, translationDependencies),
        )
        .join(', '),
    [translationDependencies],
  );

  const chips = useMemo(
    () =>
      getSessionBrowserFilterChipDescriptors(filters, {
        placeLabel,
        placeVersionLabel,
        formatPlaceIds,
        formatPlaceVersions,
      }),
    [filters, formatPlaceIds, formatPlaceVersions, placeLabel, placeVersionLabel],
  );

  const handleDelete = useCallback(
    (chipKey: SessionBrowserFilterChipKey) => {
      onChange(clearSessionBrowserFilterChip(filters, chipKey));
    },
    [filters, onChange],
  );

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className='flex wrap gap-small'>
      {chips.map((chip) => (
        <FilterChip
          key={chip.key}
          label={chip.label}
          onDelete={() => {
            handleDelete(chip.key);
          }}
        />
      ))}
    </div>
  );
};

export default withNamespaceSwitchedTranslation(ClientSessionBrowserFilterChips, [
  TranslationNamespace.Analytics,
]);
