import React, { FunctionComponent, useMemo, useCallback } from 'react';
import { useFormContext, Controller, FieldError } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Autocomplete, TextField } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { TaxIdType } from '@modules/clients/brandPlatform';
import { InputFormData, TaxIdValidationState } from '../../../types';
import useTaxIdValidationState from '../../../hooks/useTaxIdValidationState';

export const taxIdTypeToTranslationKey: Record<TaxIdType, string> = {
  [TaxIdType.Invalid]: 'Label.None',
  [TaxIdType.UnitedStatesEin]: 'Label.TaxIdType.UnitedStatesEin',
  [TaxIdType.EuropeanVatNumber]: 'Label.TaxIdType.EuropeanVatNumber',
  [TaxIdType.UnitedKingdomVatNumber]: 'Label.TaxIdType.UnitedKingdomVatNumber',
  [TaxIdType.CanadianBusinessNumber]: 'Label.TaxIdType.CanadianBusinessNumber',
  [TaxIdType.CanadianGstHstNumber]: 'Label.TaxIdType.CanadianGstHstNumber',
  [TaxIdType.MexicanRfcNumber]: 'Label.TaxIdType.MexicanRfcNumber',
};

const AccountTaxIdTypeInput: FunctionComponent = () => {
  const { control, formState, watch, setValue } = useFormContext<InputFormData>();
  const { translate } = useTranslation();

  const taxIdType = watch('accountInfo.taxId.type');
  const taxIdValue = watch('accountInfo.taxId.id');

  const options = useMemo(
    () => Object.values(TaxIdType).filter((type) => type !== TaxIdType.Invalid),
    [],
  );

  const validationState = useTaxIdValidationState(taxIdType, taxIdValue);

  const validateTaxIdType = useCallback((): string | true => {
    if (
      validationState === TaxIdValidationState.IdOnly &&
      taxIdValue &&
      !taxIdValue.startsWith('*')
    ) {
      return translate('Message.Account.TaxIdInvalid');
    }

    return true;
  }, [validationState, taxIdValue, translate]);

  return (
    <Controller
      name='accountInfo.taxId.type'
      control={control}
      defaultValue={TaxIdType.Invalid}
      rules={{ validate: validateTaxIdType }}
      render={({ field }) => {
        return (
          <Autocomplete
            {...field}
            value={field.value !== TaxIdType.Invalid ? field.value : null}
            onChange={(event, value) => {
              const newValue = value || TaxIdType.Invalid;

              // If clearing the type, also clear the tax ID immediately
              if (!newValue || newValue === TaxIdType.Invalid) {
                setValue('accountInfo.taxId.id', '', { shouldDirty: true });
              }

              field.onChange(newValue);
            }}
            autoComplete
            autoHighlight
            options={options}
            getOptionLabel={(option) => translate(taxIdTypeToTranslationKey[option as TaxIdType])}
            isOptionEqualToValue={(option, value) => option === value}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                id='accountInfo.taxId.type'
                label={translate('Label.Account.TaxIdType')}
                error={!!formState.errors.accountInfo?.taxId?.type}
                helperText={
                  (formState.errors.accountInfo?.taxId?.type as FieldError | undefined)?.message
                }
              />
            )}
          />
        );
      }}
    />
  );
};

export default withTranslation(AccountTaxIdTypeInput, [TranslationNamespace.CreatorAccount]);
