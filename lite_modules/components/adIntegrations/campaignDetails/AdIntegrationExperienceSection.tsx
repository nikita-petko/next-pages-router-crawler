import { Autocomplete, AutocompleteOption } from '@rbx/foundation-ui';
import { useEffect, useState } from 'react';
import { Control, Controller, useWatch } from 'react-hook-form';

import styles from '@components/adIntegrations/campaignDetails/AdIntegrationExperienceSection.module.css';
import useCampaignBuilderCommonStyles from '@components/campaignBuilder/common/CampaignBuilderCommon.styles';
import UniverseThumbnailImage from '@components/common/creative/UniverseThumbnailImage';
import { AdIntegrationFormField, MaxUniversesPerCampaign } from '@constants/adIntegrations';
import { warningUniverseId } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { ThumbnailStoreType, useThumbnailStore } from '@stores/thumbnailStoreProvider';
import {
  AdIntegrationCampaignDetailsFormValues,
  AdIntegrationFormMode,
} from '@type/adIntegrations';
import { UniverseShapeType } from '@type/universe';

type ExperienceOption = Pick<UniverseShapeType, 'universe_id' | 'universe_name'>;

interface AdIntegrationExperienceSectionProps {
  control: Control<AdIntegrationCampaignDetailsFormValues>;
  disabled?: boolean;
  errorMessage?: string;
  isCampaignInProgress: boolean;
  isMultiExperienceEnabled: boolean;
  mode: AdIntegrationFormMode;
  universes: UniverseShapeType[];
}

const AdIntegrationExperienceSection = ({
  control,
  disabled = false,
  errorMessage,
  isCampaignInProgress,
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
  // The form field holds every selection, so the single-select flow reads the
  // head of the same array the multi-select flow renders in full.
  const selectedExperienceIds =
    useWatch({
      control,
      name: AdIntegrationFormField.ExperienceIds,
    }) ?? [];
  const selectedExperienceId = selectedExperienceIds[0] ?? warningUniverseId;
  const hasEligibleExperiences = universes.length > 0;
  const selectedEligibleExperience = universes.find(
    (universe) => universe.universe_id === selectedExperienceId,
  );
  const isExperienceNoLongerEligible =
    hasEligibleExperiences &&
    mode === 'edit' &&
    selectedExperienceId > warningUniverseId &&
    !selectedEligibleExperience;

  const noExperienceFoundOption: ExperienceOption = {
    universe_id: warningUniverseId,
    universe_name: translateCampaign('Description.NoExperiencesFound'),
  };

  const experienceNoLongerEligibleOption: ExperienceOption = {
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
  const selectedExperiences = selectedExperienceIds
    .map((universeId) => universes.find((universe) => universe.universe_id === universeId))
    .filter((universe): universe is UniverseShapeType => universe !== undefined);

  const selectedOption: ExperienceOption =
    selectedEligibleExperience ??
    (isExperienceNoLongerEligible ? experienceNoLongerEligibleOption : noExperienceFoundOption);
  const options: ExperienceOption[] = hasEligibleExperiences
    ? universes
    : [noExperienceFoundOption];

  const [inputValue, setInputValue] = useState<string>(selectedOption.universe_name);
  const [multiInputValue, setMultiInputValue] = useState<string>('');

  // Resync the text when the selection changes outside the field (mode switch,
  // universes finishing loading) so a stale experience name is never shown.
  useEffect(() => {
    setInputValue(selectedOption.universe_name);
  }, [selectedOption.universe_id, selectedOption.universe_name]);

  // MUI filtered options internally from `getOptionLabel`; Foundation expects the
  // caller to render the filtered set. Text equal to the current selection shows
  // the full list so clicking into the field does not narrow it to one row.
  // Universe names can carry leading/trailing whitespace, so both sides are
  // trimmed before comparing — otherwise that check misses for those names and
  // the list collapses to the selected row.
  const query = inputValue.trim().toLocaleLowerCase();
  const visibleOptions =
    !query || query === selectedOption.universe_name.trim().toLocaleLowerCase()
      ? options
      : options.filter((option) => option.universe_name.trim().toLocaleLowerCase().includes(query));

  const multiQuery = multiInputValue.trim().toLocaleLowerCase();
  const visibleMultiOptions = multiQuery
    ? universes.filter((universe) =>
        universe.universe_name.trim().toLocaleLowerCase().includes(multiQuery),
      )
    : universes;
  const hasReachedSelectionLimit = selectedExperienceIds.length >= MaxUniversesPerCampaign;
  const multiExperienceHelperText = isCampaignInProgress
    ? translateCampaign('Description.GamesCannotBeAddedAfterCampaignStarts')
    : translateAccount('Description.ChooseUpTo20Games');
  // Foundation reads multi-select chip text from the `title` of the options it is
  // currently rendering, so a selected experience the filter leaves out is rendered
  // hidden purely to supply its label.
  const unlistedSelectedExperiences = selectedExperiences.filter(
    (selected) =>
      !visibleMultiOptions.some((option) => option.universe_id === selected.universe_id),
  );

  return (
    <>
      <Controller
        control={control}
        name={AdIntegrationFormField.ExperienceIds}
        render={({ field }) =>
          isMultiExperienceEnabled ? (
            <Autocomplete
              className={`width-full ${styles.preserveSelectedGameContrast}`}
              data-testid='ad-integration-multi-experience-autocomplete'
              error={errorMessage}
              hasError={Boolean(errorMessage)}
              helperText={errorMessage ? undefined : multiExperienceHelperText}
              inputValue={multiInputValue}
              isDisabled={disabled || !hasEligibleExperiences}
              label={translateCreativeLibrary('Label.Game')}
              multiple
              multiSelectLayout='Expand'
              onInputValueChange={setMultiInputValue}
              onValueChange={(nextValues) => {
                const nextSelectedExperienceIds = Array.from(
                  new Set(nextValues.map((nextValue) => Number(nextValue))),
                ).slice(0, MaxUniversesPerCampaign);
                // Match MUI, which reset the query after each selection.
                setMultiInputValue('');
                field.onChange(nextSelectedExperienceIds);
              }}
              placeholder={translateAccount('Label.ChooseAGame')}
              size='Medium'
              value={selectedExperienceIds.map((universeId) => String(universeId))}>
              {visibleMultiOptions.map((option) => (
                <AutocompleteOption
                  disabled={
                    hasReachedSelectionLimit && !selectedExperienceIds.includes(option.universe_id)
                  }
                  key={option.universe_id}
                  leading={
                    <UniverseThumbnailImage
                      size={24}
                      src={thumbnailsByUniverseId[option.universe_id]?.data?.imageUrl}
                    />
                  }
                  title={option.universe_name}
                  value={String(option.universe_id)}
                />
              ))}
              {unlistedSelectedExperiences.map((option) => (
                <AutocompleteOption
                  className='hidden'
                  disabled
                  key={option.universe_id}
                  title={option.universe_name}
                  value={String(option.universe_id)}
                />
              ))}
            </Autocomplete>
          ) : (
            <Autocomplete
              data-testid='ad-integration-experience-autocomplete'
              error={errorMessage}
              hasError={Boolean(errorMessage)}
              inputValue={inputValue}
              isDisabled={disabled || mode === 'edit' || !hasEligibleExperiences}
              label={translateCreativeLibrary('Label.Experience')}
              leadingIconNode={
                selectedExperienceId > warningUniverseId ? (
                  <UniverseThumbnailImage size={24} src={selectedThumbnailUrl} />
                ) : undefined
              }
              // Foundation keeps edited text on blur, so restore the selected name
              // when the user typed without picking an option.
              onBlur={() => setInputValue(selectedOption.universe_name)}
              onInputValueChange={setInputValue}
              onValueChange={(nextValue) => {
                const option = options.find(
                  (candidate) => String(candidate.universe_id) === nextValue,
                );
                if (!option) {
                  return;
                }
                field.onChange([option.universe_id]);
                setInputValue(option.universe_name);
              }}
              size='Medium'
              value={String(selectedOption.universe_id)}>
              {visibleOptions.map((option) => (
                <AutocompleteOption
                  key={option.universe_id}
                  title={option.universe_name}
                  value={String(option.universe_id)}
                />
              ))}
            </Autocomplete>
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
