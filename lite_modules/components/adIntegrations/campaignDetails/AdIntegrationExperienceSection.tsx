import { Autocomplete, TextField, Typography } from '@rbx/ui';
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
  mode: AdIntegrationFormMode;
  universes: UniverseShapeType[];
}

const AdIntegrationExperienceSection = ({
  control,
  errorMessage,
  mode,
  universes,
}: AdIntegrationExperienceSectionProps) => {
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

  return (
    <>
      <Controller
        control={control}
        name={AdIntegrationFormField.Experience}
        render={({ field }) => (
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
                error={Boolean(errorMessage)}
                helperText={errorMessage}
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
        )}
      />
      {!hasEligibleExperiences && (
        <Typography className={spacedWarning} color='warning' variant='smallLabel1'>
          {translateCampaign('Description.CreateEligibleExperience')}
        </Typography>
      )}
      {isExperienceNoLongerEligible && (
        <Typography className={spacedWarning} color='warning' variant='smallLabel1'>
          {translateCampaign('Description.ExperienceNoLongerEligible')}
        </Typography>
      )}
    </>
  );
};

export default AdIntegrationExperienceSection;
