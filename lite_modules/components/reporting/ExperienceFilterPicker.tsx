import { Autocomplete, AutocompleteOption } from '@rbx/foundation-ui';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import AppTooltip from '@components/common/AppTooltip';
import UniverseFilterAvatar from '@components/common/UniverseFilterAvatar';
import useExperienceFilterPickerStyles from '@components/reporting/ExperienceFilterPicker.styles';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import useWorkspaceUniverseMemory from '@hooks/useWorkspaceUniverseMemory';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';
import { ThumbnailStoreType, useThumbnailStore } from '@stores/thumbnailStoreProvider';
import { ThumbnailType } from '@type/thumbnail';
import { AdvertisedUniverse } from '@type/universe';
import { EmptyRequestStateType } from '@utils/zustandUtils';

const getUniverseAvatar = (
  universe: AdvertisedUniverse | undefined,
  thumbnailsByUniverseId: Record<number, EmptyRequestStateType<ThumbnailType>>,
) =>
  universe && universe.universe_id !== 0 ? (
    <UniverseFilterAvatar src={thumbnailsByUniverseId[universe.universe_id]?.data?.imageUrl} />
  ) : undefined;

const ExperienceFilterPicker = () => {
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateCreativeLibrary } = useNamespacedTranslation(
    TranslationNamespace.CreativeLibrary,
  );
  const router = useRouter();
  const { rememberUniverseId } = useWorkspaceUniverseMemory();
  const {
    classes: { experiencePicker },
  } = useExperienceFilterPickerStyles();

  const {
    data: universes,
    isError: advertisedUniversesIsError,
    isLoading,
  } = useNewFlowStore((state: NewFlowStoreType) => state.advertisedUniversesState);
  const { isError: universePickerIsError, universeFilter } = useNewFlowStore(
    (state: NewFlowStoreType) => state.universePickerFilterState,
  );
  const handleUniversePickerChange = useNewFlowStore(
    (state: NewFlowStoreType) => state.handleUniversePickerChange,
  );

  const thumbnailsByUniverseId = useThumbnailStore(
    (state: ThumbnailStoreType) => state.thumbnailsByUniverseId,
  );

  const showNoEligibleUniversesHelperText =
    !isLoading && !advertisedUniversesIsError && universes.length === 0;
  const isDisabled = advertisedUniversesIsError || showNoEligibleUniversesHelperText || isLoading;
  const showErrorHelperText = universePickerIsError || advertisedUniversesIsError;

  const universesById = useMemo(() => {
    const map = new Map<string, AdvertisedUniverse>();
    universes.forEach((u) => map.set(u.universe_id.toString(), u));
    if (universeFilter) {
      map.set(universeFilter.universe_id.toString(), universeFilter);
    }
    return map;
  }, [universes, universeFilter]);

  const [inputValue, setInputValue] = useState<string>(universeFilter?.universe_name ?? '');

  // Keep the input in sync when the store's universeFilter changes externally
  // (e.g. filter reset, route change) so we don't display a stale name.
  useEffect(() => {
    setInputValue(universeFilter?.universe_name ?? '');
  }, [universeFilter?.universe_id, universeFilter?.universe_name]);

  const handleUniverseChange = (universeObj: AdvertisedUniverse) => {
    handleUniversePickerChange(universeObj);
    rememberUniverseId(universeObj.universe_id);

    const query = { ...router.query };
    if (universeObj.universe_id === 0) {
      delete query.universeId;
    } else {
      query.universeId = String(universeObj.universe_id);
    }
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
    logNativeClickEvent(EventName.ExperienceFilterOptionClicked, {
      universeId: universeObj.universe_id.toString(),
      universeName: universeObj.universe_name,
    });
  };

  const filteredUniverses = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    const filtered =
      !query || query === universeFilter?.universe_name.toLowerCase()
        ? universes
        : universes.filter((u) => u.universe_name.toLowerCase().includes(query));

    // Ensure the currently selected universe is always present as an option so
    // Foundation Autocomplete's `value` prop resolves to a real child. This
    // includes the sentinel "All" filter (universe_id === 0), which the
    // backend does not send back in the `universes` payload.
    if (universeFilter && !filtered.some((u) => u.universe_id === universeFilter.universe_id)) {
      return [universeFilter, ...filtered];
    }
    return filtered;
  }, [universes, inputValue, universeFilter]);

  const handleValueChange = (nextValue: string | undefined) => {
    if (nextValue === undefined) {
      return;
    }
    const universeObj = universesById.get(nextValue);
    if (!universeObj) {
      return;
    }
    handleUniverseChange(universeObj);
    setInputValue(universeObj.universe_name);
  };

  // Foundation Autocomplete does not auto-revert the input on blur, so a user
  // who clears/edits the text without picking an option would be left with a
  // stale input while the store's `universeFilter` is unchanged. Restore the
  // selected universe's name (matches previous MUI Autocomplete behavior and
  // the intent of the old `disableClearable` guard).
  const handleBlur = () => {
    const expected = universeFilter?.universe_name ?? '';
    if (inputValue !== expected) {
      setInputValue(expected);
    }
  };

  return (
    <AppTooltip
      position='top-center'
      title={advertisedUniversesIsError ? translateCampaign('Description.TryReloading') : ''}>
      <div className={`${experiencePicker} flex flex-col gap-small`}>
        <Autocomplete
          data-testid='universePickerAutocomplete'
          emptyState={translateReport('Description.NoResults')}
          error={showErrorHelperText ? translateCampaign('Description.FailedToFetch') : undefined}
          hasError={showErrorHelperText}
          inputValue={inputValue}
          isDisabled={isDisabled}
          label={translateCreativeLibrary('Label.Experience')}
          leadingIconNode={getUniverseAvatar(universeFilter, thumbnailsByUniverseId)}
          onBlur={handleBlur}
          onInputValueChange={setInputValue}
          onValueChange={handleValueChange}
          placeholder={translateCreativeLibrary('Label.Experience')}
          size='Medium'
          value={universeFilter?.universe_id.toString()}>
          {filteredUniverses.map((u) => (
            <AutocompleteOption
              key={u.universe_id}
              leading={getUniverseAvatar(u, thumbnailsByUniverseId)}
              title={u.universe_name}
              value={u.universe_id.toString()}
            />
          ))}
        </Autocomplete>
        {showNoEligibleUniversesHelperText && (
          <p
            className='margin-[0px] text-body-small content-muted'
            data-testid='universePickerNoEligibleHelperText'>
            {translateCampaign('Heading.NoEligibleExperiencesFound')}
          </p>
        )}
      </div>
    </AppTooltip>
  );
};

export default ExperienceFilterPicker;
