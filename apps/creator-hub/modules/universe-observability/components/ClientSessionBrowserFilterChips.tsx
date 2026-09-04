import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import FilterChip from '@modules/charts-generic/components/FilterChip';
import type {
  UniverseSessionExitReason,
  UniverseSessionOperatingSystem,
  UniverseSessionPlatform,
} from '@modules/clients/analytics/universeSessionMetadataApi';
import getDimensionRenderer from '@modules/experience-analytics-shared/components/getDimensionRenderer';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useClientSessionStatusLabels from '../hooks/useClientSessionStatusLabels';
import useSessionBrowserFilterLabels from '../hooks/useSessionBrowserFilterLabels';
import useSessionPlacesWithVersions, {
  EMPTY_SESSION_PLACES,
} from '../hooks/useSessionPlacesWithVersions';
import type { SessionBrowserFilters } from '../types/SessionBrowserFilters';
import {
  formatClientSessionOperatingSystem,
  formatClientSessionPlaceOption,
  formatClientSessionPlaceVersion,
  formatClientSessionPlatform,
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

function formatMappedList<T>(values: readonly T[], formatItem: (value: T) => string): string {
  return values.map(formatItem).join(', ');
}

const formatEventTags = (tags: readonly string[]): string => tags.join(', ');

const ClientSessionBrowserFilterChips: FC<ClientSessionBrowserFilterChipsProps> = ({
  universeId,
  filters,
  onChange,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const translationDependencies = useRAQIV2TranslationDependencies();
  const statusLabels = useClientSessionStatusLabels();
  const {
    funnelEventsLabel,
    customEventsLabel,
    hasBugReportLabel,
    deviceRamLabel,
    durationLabel,
    minFpsLabel,
    usedMemoryLabel,
    exitReasonLabel,
  } = useSessionBrowserFilterLabels();
  const { data: { placesById } = EMPTY_SESSION_PLACES } = useSessionPlacesWithVersions(universeId);
  const platformRenderer = getDimensionRenderer(RAQIV2Dimension.Platform);
  const operatingSystemRenderer = getDimensionRenderer(RAQIV2Dimension.OperatingSystem);

  const placeLabel = translate(
    translationKey('Label.Dimension.Place', TranslationNamespace.Analytics),
  );
  const placeVersionLabel = translate(
    translationKey('Label.Dimension.PlaceVersion', TranslationNamespace.Analytics),
  );
  const platformLabel = translate(platformRenderer.name);
  const operatingSystemLabel = translate(operatingSystemRenderer.name);

  const formatPlaceIds = useCallback(
    (placeIds: readonly string[]) =>
      formatMappedList(placeIds, (placeId) =>
        formatClientSessionPlaceOption(placeId, placesById, translationDependencies),
      ),
    [placesById, translationDependencies],
  );

  const formatPlaceVersions = useCallback(
    (placeVersions: readonly number[]) =>
      formatMappedList(placeVersions, (placeVersion) =>
        formatClientSessionPlaceVersion(placeVersion, translationDependencies),
      ),
    [translationDependencies],
  );

  const formatPlatforms = useCallback(
    (platforms: readonly UniverseSessionPlatform[]) =>
      formatMappedList(platforms, (platform) =>
        formatClientSessionPlatform(platform, translationDependencies),
      ),
    [translationDependencies],
  );

  const formatOperatingSystems = useCallback(
    (operatingSystems: readonly UniverseSessionOperatingSystem[]) =>
      formatMappedList(operatingSystems, (operatingSystem) =>
        formatClientSessionOperatingSystem(operatingSystem, translationDependencies),
      ),
    [translationDependencies],
  );

  const formatExitReasons = useCallback(
    (exitReasons: readonly UniverseSessionExitReason[]) =>
      formatMappedList(exitReasons, (exitReason) => statusLabels[exitReason]),
    [statusLabels],
  );

  const chips = useMemo(
    () =>
      getSessionBrowserFilterChipDescriptors(filters, {
        placeLabel,
        placeVersionLabel,
        funnelEventsLabel,
        customEventsLabel,
        hasBugReportLabel,
        platformLabel,
        operatingSystemLabel,
        deviceRamLabel,
        durationLabel,
        minFpsLabel,
        usedMemoryLabel,
        exitReasonLabel,
        formatPlaceIds,
        formatPlaceVersions,
        formatEventTags,
        formatPlatforms,
        formatOperatingSystems,
        formatExitReasons,
      }),
    [
      deviceRamLabel,
      durationLabel,
      exitReasonLabel,
      filters,
      formatExitReasons,
      formatOperatingSystems,
      formatPlaceIds,
      formatPlaceVersions,
      formatPlatforms,
      funnelEventsLabel,
      customEventsLabel,
      hasBugReportLabel,
      minFpsLabel,
      operatingSystemLabel,
      placeLabel,
      placeVersionLabel,
      platformLabel,
      usedMemoryLabel,
    ],
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
  TranslationNamespace.ServerManagement,
]);
