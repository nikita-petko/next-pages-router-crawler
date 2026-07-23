import { Autocomplete, FormControl, TextField, Tooltip } from '@rbx/ui';
import { HTMLAttributes } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import useAdvancedTargetingDrawerStyles from '@components/campaignBuilder/targeting/AdvancedTargetingDrawer.styles';
import GenreSelectionAutocompleteRow from '@components/campaignBuilder/targeting/GenreSelectionAutocompleteRow';
import { FormField } from '@constants/advancedTargeting';
import { FlowTypes, FORM_HELPER_TEXT_PROPS, INPUT_LABEL_PROPS } from '@constants/campaignBuilder';
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
    classes: { autocompleteBox, autoCompleteRoot, inputBaseRootOverride },
  } = useAdvancedTargetingDrawerStyles();

  const { control, getValues, trigger } = useFormContext<AdvancedTargetingFormType>();

  const { flowType, getAudienceEstimate } = useCampaignBuilderStore();
  const editMode = flowType === FlowTypes.EDIT;
  const campaignStatus = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.display_status,
  );

  return (
    <div className={autoCompleteRoot}>
      <Controller
        control={control}
        name={FormField.GENRES}
        render={({ field: { onChange, value, ...rest }, fieldState: { error } }) => (
          <Tooltip
            placement='top-start'
            title={translate(GetEditTooltipTitle({ campaignStatus, editable: false, flowType }))}>
            <Autocomplete
              {...rest}
              classes={{
                inputRoot: autocompleteBox,
                root: inputBaseRootOverride,
              }}
              data-testid='genre-autocomplete'
              disabled={editMode}
              // Render the dropdown inside the Sheet (Radix Dialog) rather than
              // portaling to <body>, which is inert while the Sheet is open and
              // would treat a dropdown click as an outside dismiss.
              disablePortal
              getOptionLabel={({ title = '' }) => translate(title)}
              id='adSetGenreTargeting'
              isOptionEqualToValue={(option, val) => option?.value === val?.value}
              limitTags={10}
              multiple
              onChange={(_event: React.ChangeEvent<object>, newOptions) => {
                const newGenreValues = GetNewGenreValues({
                  itemsSelectedBeforeInputChange: value,
                  newValues: newOptions,
                });
                onChange(newGenreValues);
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
              options={GenresToDisplay()}
              renderInput={(params) => (
                <FormControl error={!!error} variant='outlined' {...params}>
                  <TextField
                    {...params}
                    error={!!error}
                    FormHelperTextProps={FORM_HELPER_TEXT_PROPS}
                    helperText={error?.message}
                    InputLabelProps={INPUT_LABEL_PROPS}
                    label={translate('Label.Genres')}
                    name='Genre autocomplete'
                  />
                </FormControl>
              )}
              renderOption={(
                props: HTMLAttributes<HTMLLIElement> & { key: React.Key },
                option: GenreOption,
              ) => (
                <GenreSelectionAutocompleteRow
                  genreOption={option}
                  {...props}
                  key={String(props.key)}
                />
              )}
              value={value}
            />
          </Tooltip>
        )}
      />
    </div>
  );
};

export default GenreTargetingAutocomplete;
