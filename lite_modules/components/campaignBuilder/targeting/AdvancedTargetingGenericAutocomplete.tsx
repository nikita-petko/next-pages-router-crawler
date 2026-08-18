import { Autocomplete, AutocompleteOption } from '@rbx/foundation-ui';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import AppTooltip from '@components/common/AppTooltip';
import { FormField } from '@constants/advancedTargeting';
import { FlowTypes } from '@constants/campaignBuilder';
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

  const [inputValue, setInputValue] = useState<string>('');

  // MUI filtered options internally from `getOptionLabel`; Foundation expects the
  // caller to render the filtered set.
  const query = inputValue.trim().toLocaleLowerCase();
  const visibleOptions = query
    ? options.filter((option) => translate(option.label).toLocaleLowerCase().includes(query))
    : options;

  return (
    <Controller
      control={control}
      name={formField}
      render={({ field: { onChange, value, ...rest }, fieldState: { error } }) => {
        const selectedOptions = value as GenericAutocompleteOption[];
        return (
          <AppTooltip
            title={translate(GetEditTooltipTitle({ campaignStatus, editable: false, flowType }))}>
            <div className={className}>
              <Autocomplete
                {...rest}
                error={error?.message}
                hasError={!!error}
                inputValue={inputValue}
                isDisabled={editMode}
                label={label}
                multiple
                onInputValueChange={setInputValue}
                onValueChange={(nextValues) => {
                  const newSelectedOptions = GetNewSelectedOptions({
                    availableOptions: options,
                    newSelectedOptions: nextValues
                      .map((nextValue) =>
                        options.find((option) => String(option.value) === nextValue),
                      )
                      .filter((option): option is GenericAutocompleteOption => Boolean(option)),
                    selectedOptions,
                  });
                  onChange(newSelectedOptions);
                  // Match MUI, which reset the query after each selection.
                  setInputValue('');
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
                size='Medium'
                value={selectedOptions.map((option) => String(option.value))}>
                {visibleOptions.map((option) => (
                  <AutocompleteOption
                    key={option.value}
                    title={translate(option.label)}
                    value={String(option.value)}
                  />
                ))}
              </Autocomplete>
            </div>
          </AppTooltip>
        );
      }}
    />
  );
};

export default AdvancedTargetingGenericAutocomplete;
