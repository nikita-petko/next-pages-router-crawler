import { Autocomplete, TextField } from '@rbx/ui';
import { useState } from 'react';
import { Control, Controller, useWatch } from 'react-hook-form';

import useCampaignBuilderCommonStyles from '@components/campaignBuilder/common/CampaignBuilderCommon.styles';
import UniverseFilterAvatar from '@components/common/UniverseFilterAvatar';
import { AdIntegrationFormField } from '@constants/adIntegrations';
import { warningUniverseId } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { ThumbnailStoreType, useThumbnailStore } from '@stores/thumbnailStoreProvider';
import {
  AdIntegrationCampaignDetailsFormValues,
  AdIntegrationFormMode,
} from '@type/adIntegrations';
import { UniverseShapeType } from '@type/universe';

interface AdIntegrationExperienceSectionProps {
  control: Control<AdIntegrationCampaignDetailsFormValues>;
  errorMessage?: string;
  isMultiExperienceEnabled: boolean;
  mode: AdIntegrationFormMode;
  universes: UniverseShapeType[];
}

const MaxAutocompleteSelections = 20;

const AdIntegrationExperienceSection = ({
  control,
  errorMessage,
  isMultiExperienceEnabled,
  mode,
  universes,
}: AdIntegrationExperienceSectionProps) => {
  const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateCreativeLibrary } = useNamespacedTranslation(
    TranslationNamespace.CreativeLibrary,
  );
  const {
    classes: { spacedWarning },
  } = useCampaignBuilderCommonStyles();
  const selectedExperienceId = useWatch({
    control,
    name: AdIntegrationFormField.Experience,
  });
  const hasEligibleExperiences = universes.length > 0;
  const selectedEligibleExperience = universes.find(
    (universe) => universe.universe_id === selectedExperienceId,
  );
  const isExperienceNoLongerEligible =
    hasEligibleExperiences &&
    mode === 'edit' &&
    selectedExperienceId > warningUniverseId &&
    !selectedEligibleExperience;

  const noExperienceFoundOption: Pick<UniverseShapeType, 'universe_id' | 'universe_name'> = {
    universe_id: warningUniverseId,
    universe_name: translateCampaign('Description.NoExperiencesFound'),
  };

  const experienceNoLongerEligibleOption: Pick<UniverseShapeType, 'universe_id' | 'universe_name'> =
    {
      universe_id: selectedExperienceId,
      universe_name: translateCampaign('Description.ExperienceNotFound'),
    };
  const thumbnailsByUniverseId = useThumbnailStore(
    (state: ThumbnailStoreType) => state.thumbnailsByUniverseId,
  );
  const selectedThumbnailUrl =
    selectedExperienceId > warningUniverseId
      ? thumbnailsByUniverseId[selectedExperienceId]?.data?.imageUrl
      : undefined;
  const [selectedExperienceIds, setSelectedExperienceIds] = useState<number[]>([]);
  const selectedExperiences = selectedExperienceIds
    .map((universeId) => universes.find((universe) => universe.universe_id === universeId))
    .filter((universe): universe is UniverseShapeType => universe !== undefined);
  const experienceErrorMessage = isMultiExperienceEnabled ? undefined : errorMessage;

  return (
    <>
      <Controller
        control={control}
        name={AdIntegrationFormField.Experience}
        render={({ field }) =>
          isMultiExperienceEnabled ? (
            <Autocomplete
              disabled={!hasEligibleExperiences}
              getOptionDisabled={(option) =>
                selectedExperienceIds.length >= MaxAutocompleteSelections &&
                !selectedExperienceIds.includes(option.universe_id)
              }
              getOptionLabel={(option) => option.universe_name}
              isOptionEqualToValue={(option, value) => option.universe_id === value.universe_id}
              multiple
              onChange={(_event, selectedOptions) => {
                const nextSelectedExperienceIds = Array.from(
                  new Set(selectedOptions.map((option) => option.universe_id)),
                ).slice(0, MaxAutocompleteSelections);
                setSelectedExperienceIds(nextSelectedExperienceIds);
                field.onChange(nextSelectedExperienceIds[0] ?? 0);
              }}
              options={universes}
              renderInput={(params) => (
                <TextField
                  {...params}
                  error={Boolean(experienceErrorMessage)}
                  helperText={
                    experienceErrorMessage ?? translateAccount('Description.ChooseUpTo20Games')
                  }
                  InputLabelProps={{ shrink: true }}
                  label={translateCreativeLibrary('Label.Game')}
                  placeholder={translateAccount('Label.ChooseAGame')}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.universe_id}>
                  <UniverseFilterAvatar
                    src={thumbnailsByUniverseId[option.universe_id]?.data?.imageUrl}
                  />
                  <span className='margin-left-small'>{option.universe_name}</span>
                </li>
              )}
              value={selectedExperiences}
            />
          ) : (
            <Autocomplete
              disableClearable
              disabled={mode === 'edit' || !hasEligibleExperiences}
              getOptionLabel={(option) => option.universe_name}
              isOptionEqualToValue={(option, value) => option.universe_id === value.universe_id}
              onChange={(_event, option) => {
                field.onChange(option.universe_id);
              }}
              options={hasEligibleExperiences ? universes : [noExperienceFoundOption]}
              renderInput={(params) => (
                <TextField
                  {...params}
                  error={Boolean(experienceErrorMessage)}
                  helperText={experienceErrorMessage}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment:
                      selectedExperienceId > warningUniverseId ? (
                        <UniverseFilterAvatar src={selectedThumbnailUrl} />
                      ) : null,
                  }}
                  label={translateCreativeLibrary('Label.Experience')}
                />
              )}
              value={
                selectedEligibleExperience ??
                (isExperienceNoLongerEligible
                  ? experienceNoLongerEligibleOption
                  : noExperienceFoundOption)
              }
            />
          )
        }
      />
      {!hasEligibleExperiences && (
        <span className={`text-body-medium content-system-warning ${spacedWarning}`}>
          {translateCampaign('Description.CreateEligibleExperience')}
        </span>
      )}
      {isExperienceNoLongerEligible && (
        <span className={`text-body-medium content-system-warning ${spacedWarning}`}>
          {translateCampaign('Description.ExperienceNoLongerEligible')}
        </span>
      )}
    </>
  );
};

export default AdIntegrationExperienceSection;
