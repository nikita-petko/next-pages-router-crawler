import { Autocomplete, FormControl, FormHelperText, TextField, Tooltip } from '@rbx/ui';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import UniverseFilterAvatar from '@components/common/UniverseFilterAvatar';
import useExperienceFilterPickerStyles from '@components/reporting/ExperienceFilterPicker.styles';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';
import { ThumbnailStoreType, useThumbnailStore } from '@stores/thumbnailStoreProvider';
import { ThumbnailType } from '@type/thumbnail';
import { AdvertisedUniverse } from '@type/universe';
import { EmptyRequestStateType } from '@utils/zustandUtils';

const maybeGetUniverseFilterThumbnail = (
  universeFilter: AdvertisedUniverse,
  thumbnailsByUniverseId: Record<number, EmptyRequestStateType<ThumbnailType>>,
) =>
  universeFilter && universeFilter.universe_id !== 0 ? (
    <UniverseFilterAvatar
      src={thumbnailsByUniverseId[universeFilter.universe_id]?.data?.imageUrl}
    />
  ) : null;

const ExperienceFilterPicker = () => {
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateCreativeLibrary } = useNamespacedTranslation(
    TranslationNamespace.CreativeLibrary,
  );
  const {
    classes: { experiencePicker },
  } = useExperienceFilterPickerStyles();

  const campaignsIsLoading = useNewFlowStore(
    (state: NewFlowStoreType) => state.campaignsState.isLoading,
  );
  const filterIsLoading = useNewFlowStore(
    (state: NewFlowStoreType) => state.filteredIdsState.isLoading,
  );
  const summaryStatsIsLoading = useNewFlowStore(
    (state: NewFlowStoreType) => state.summaryStatsState.isLoading,
  );
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

  const showErrorHelperText = universePickerIsError || advertisedUniversesIsError;

  return (
    <Tooltip
      placement='top'
      title={advertisedUniversesIsError ? translateCampaign('Description.TryReloading') : ''}>
      <Autocomplete
        disableClearable={universes.length === 1}
        disabled={
          advertisedUniversesIsError ||
          isLoading ||
          campaignsIsLoading ||
          filterIsLoading ||
          summaryStatsIsLoading
        }
        getOptionLabel={({ universe_name }) => universe_name}
        id='universe-filter-picker'
        onChange={(_event, universeObj) => {
          if (!universeObj) {
            return;
          }
          handleUniversePickerChange(universeObj);
          logNativeClickEvent(EventName.ExperienceFilterOptionClicked, {
            universeId: universeObj.universe_id.toString(),
            universeName: universeObj.universe_name,
          });
        }}
        options={universes}
        renderInput={(params) => (
          <FormControl className={experiencePicker} error={showErrorHelperText} variant='outlined'>
            <TextField
              {...params}
              InputProps={{
                ...params.InputProps,
                startAdornment: maybeGetUniverseFilterThumbnail(
                  universeFilter,
                  thumbnailsByUniverseId,
                ),
                style: { height: '44px', paddingTop: '4px' },
              }}
              label={translateCreativeLibrary('Label.Experience')}
            />
            {showErrorHelperText && (
              <FormHelperText data-testid='universePickerErrorHelperText'>
                {translateCampaign('Description.FailedToFetch')}
              </FormHelperText>
            )}
          </FormControl>
        )}
        value={universeFilter}
      />
    </Tooltip>
  );
};

export default ExperienceFilterPicker;
