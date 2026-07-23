import { Autocomplete, FormControl, TextField, Tooltip } from '@rbx/ui';
import { uniqBy } from 'lodash';
import { Controller, useFormContext } from 'react-hook-form';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import useAdvancedTargetingDrawerStyles from '@components/campaignBuilder/targeting/AdvancedTargetingDrawer.styles';
import { FormField } from '@constants/advancedTargeting';
import { FlowTypes, FORM_HELPER_TEXT_PROPS, INPUT_LABEL_PROPS } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType as AdvancedTargetingFormType } from '@hooks/campaignBuilder/advancedTargetingFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { GenericAutocompleteOption } from '@type/advancedTargeting';
import { AwaitErrorsThenMaybeGetAudienceEstimate } from '@utils/advancedTargeting';
import { GetNewSelectedOptions } from '@utils/advancedTargetingGenericAutocomplete';
import { GetEditTooltipTitle } from '@utils/campaignBuilder';

interface AdvancedTargetingGenericAutocompleteProps {
  className?: string;
  formField: FormField;
  label: string;
  options: GenericAutocompleteOption[];
}

const AdvancedTargetingGenericAutocomplete = ({
  className,
  formField,
  label,
  options,
}: AdvancedTargetingGenericAutocompleteProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { control, getValues, trigger } = useFormContext<AdvancedTargetingFormType>();
  const { flowType, getAudienceEstimate } = useCampaignBuilderStore();
  const editMode = flowType === FlowTypes.EDIT;
  const campaignStatus = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.display_status,
  );

  const {
    classes: { genericAutocompleteSelectedListItem },
    cx,
  } = useAdvancedTargetingDrawerStyles();

  return (
    <Controller
      control={control}
      name={formField}
      render={({ field: { onChange, value, ...rest }, fieldState: { error } }) => (
        <Tooltip
          placement='top-start'
          title={translate(GetEditTooltipTitle({ campaignStatus, editable: false, flowType }))}>
          <Autocomplete
            {...rest}
            className={className}
            disabled={editMode}
            // Render the dropdown inside the Sheet (Radix Dialog) rather than
            // portaling to <body>, which is inert while the Sheet is open and
            // would treat a dropdown click as an outside dismiss.
            disablePortal
            getOptionLabel={(option) => translate(option.label)}
            multiple
            onChange={(_event: React.ChangeEvent<object>, newOptions) => {
              const newSelectedOptions = GetNewSelectedOptions({
                availableOptions: options,
                newSelectedOptions: uniqBy(newOptions, 'value'),
                selectedOptions: value as GenericAutocompleteOption[],
              });
              onChange(newSelectedOptions);
              logNativeClickEvent(EventName.AudienceTargetingFieldChanged, {
                field: formField,
                newValue: JSON.stringify(newSelectedOptions),
                previousValue: JSON.stringify(value),
              });
              AwaitErrorsThenMaybeGetAudienceEstimate({
                formField,
                getAudienceEstimate,
                getValues,
                newSelectedOptions,
                trigger,
              });
            }}
            options={options}
            renderInput={(params) => (
              <FormControl error={!!error} variant='outlined' {...params}>
                <TextField
                  {...params}
                  error={!!error}
                  FormHelperTextProps={FORM_HELPER_TEXT_PROPS}
                  helperText={error?.message}
                  InputLabelProps={INPUT_LABEL_PROPS}
                  label={label}
                />
              </FormControl>
            )}
            renderOption={(props, option) => {
              const selected: boolean = (value as GenericAutocompleteOption[]).some(
                (item: GenericAutocompleteOption) => item.value === option.value,
              );
              // Set the background color to the default background color of a selected mui autocomplete option
              // For some reason, introducing the react-hook-form controller broke detecting selected options, and I haven't found a better workaround
              return (
                <li
                  {...props}
                  className={cx(props.className, {
                    [genericAutocompleteSelectedListItem]: selected,
                  })}>
                  {translate(option.label)}
                </li>
              );
            }}
            value={value as GenericAutocompleteOption[]}
          />
        </Tooltip>
      )}
    />
  );
};

export default AdvancedTargetingGenericAutocomplete;
