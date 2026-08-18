import { Autocomplete, AutocompleteOption } from '@rbx/foundation-ui';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import useAdvancedTargetingDrawerStyles from '@components/campaignBuilder/targeting/AdvancedTargetingDrawer.styles';
import AppTooltip from '@components/common/AppTooltip';
import { FormField } from '@constants/advancedTargeting';
import { FlowTypes } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType as AdvancedTargetingFormType } from '@hooks/campaignBuilder/advancedTargetingFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { GenreOption } from '@type/genreAutocomplete';
import { AwaitErrorsThenMaybeGetAudienceEstimate } from '@utils/advancedTargeting';
import { GetEditTooltipTitle } from '@utils/campaignBuilder';
import { GenresToDisplay, GetNewGenreValues } from '@utils/genreAutocomplete';

const GenreTargetingAutocomplete = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const {
    classes: { autoCompleteRoot },
  } = useAdvancedTargetingDrawerStyles();

  const { control, getValues, trigger } = useFormContext<AdvancedTargetingFormType>();

  const { flowType, getAudienceEstimate } = useCampaignBuilderStore();
  const editMode = flowType === FlowTypes.EDIT;
  const campaignStatus = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.display_status,
  );

  const [inputValue, setInputValue] = useState<string>('');

  const genreOptions = GenresToDisplay();
  // MUI filtered options internally from `getOptionLabel`; Foundation expects the
  // caller to render the filtered set.
  const query = inputValue.trim().toLocaleLowerCase();
  const visibleOptions = query
    ? genreOptions.filter((genre) => translate(genre.title).toLocaleLowerCase().includes(query))
    : genreOptions;
  const visibleValues = new Set(visibleOptions.map((genre) => String(genre.value)));

  return (
    <div className={autoCompleteRoot}>
      <Controller
        control={control}
        name={FormField.GENRES}
        render={({ field: { onChange, value, ...rest }, fieldState: { error } }) => {
          const selectedGenres = value as GenreOption[];
          const genreByValue = new Map<string, GenreOption>(
            [...selectedGenres, ...genreOptions].map((genre) => [String(genre.value), genre]),
          );
          // Foundation reads multi-select chip text from the `title` of the options it
          // is currently rendering, so any selected genre that the filter (or the
          // deprecation list) leaves out is rendered hidden purely to supply its label.
          const unlistedSelectedGenres = selectedGenres.filter(
            (genre) => !visibleValues.has(String(genre.value)),
          );

          return (
            <AppTooltip
              title={translate(GetEditTooltipTitle({ campaignStatus, editable: false, flowType }))}>
              <div>
                <Autocomplete
                  {...rest}
                  data-testid='genre-autocomplete'
                  error={error?.message}
                  hasError={!!error}
                  inputValue={inputValue}
                  isDisabled={editMode}
                  label={translate('Label.Genres')}
                  multiple
                  onInputValueChange={setInputValue}
                  onValueChange={(nextValues) => {
                    const newGenreValues = GetNewGenreValues({
                      itemsSelectedBeforeInputChange: selectedGenres,
                      newValues: nextValues
                        .map((nextValue) => genreByValue.get(nextValue))
                        .filter((genre): genre is GenreOption => Boolean(genre)),
                    });
                    onChange(newGenreValues);
                    // Match MUI, which reset the query after each selection.
                    setInputValue('');
                    logNativeClickEvent(EventName.AudienceTargetingFieldChanged, {
                      field: FormField.GENRES,
                      newValue: JSON.stringify(newGenreValues),
                      previousValue: JSON.stringify(value),
                    });
                    AwaitErrorsThenMaybeGetAudienceEstimate({
                      formField: FormField.GENRES,
                      getAudienceEstimate,
                      getValues,
                      newSelectedOptions: newGenreValues,
                      trigger,
                    });
                  }}
                  size='Medium'
                  value={selectedGenres.map((genre) => String(genre.value))}>
                  {visibleOptions.map((genre) => (
                    <AutocompleteOption
                      description={genre.description ? translate(genre.description) : undefined}
                      key={genre.value}
                      title={translate(genre.title)}
                      value={String(genre.value)}
                    />
                  ))}
                  {unlistedSelectedGenres.map((genre) => (
                    <AutocompleteOption
                      className='hidden'
                      disabled
                      key={genre.value}
                      title={translate(genre.title)}
                      value={String(genre.value)}
                    />
                  ))}
                </Autocomplete>
              </div>
            </AppTooltip>
          );
        }}
      />
    </div>
  );
};

export default GenreTargetingAutocomplete;
