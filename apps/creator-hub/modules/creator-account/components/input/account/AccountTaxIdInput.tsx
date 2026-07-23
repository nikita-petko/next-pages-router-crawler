import React, { FunctionComponent, useEffect, useCallback } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TextField } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { validateTaxIdFormat, getTaxIdPlaceholderExample } from '../../../utils/taxIdValidation';
import { InputFormData, TaxIdValidationState } from '../../../types';
import useTaxIdValidationState from '../../../hooks/useTaxIdValidationState';

const AccountTaxIdInput: FunctionComponent = () => {
  const { control, formState, watch, trigger } = useFormContext<InputFormData>();
  const { translate } = useTranslation();

  const taxIdType = watch('accountInfo.taxId.type');
  const taxIdValue = watch('accountInfo.taxId.id');

  const validationState = useTaxIdValidationState(taxIdType, taxIdValue);

  // Trigger validation when validation state or tax ID type changes
  useEffect(() => {
    trigger('accountInfo.taxId.id');
  }, [validationState, taxIdType, trigger]);

  // Trigger validation when tax ID value changes to ensure latest state is used
  useEffect(() => {
    if (taxIdValue !== undefined) {
      trigger('accountInfo.taxId.id');
    }
  }, [taxIdValue, trigger]);

  const validateTaxId = useCallback(
    (value: string): string | true => {
      // Only show validation errors if the user has made actual changes
      const taxIdFieldIsDirty = formState.dirtyFields.accountInfo?.taxId?.id;
      const taxIdTypeFieldIsDirty = formState.dirtyFields.accountInfo?.taxId?.type;

      if (!taxIdFieldIsDirty && !taxIdTypeFieldIsDirty) {
        return true;
      }

      switch (validationState) {
        case TaxIdValidationState.Empty:
          return true;

        case TaxIdValidationState.Masked:
        case TaxIdValidationState.TypeOnly:
        case TaxIdValidationState.IdOnly:
          return translate('Message.Account.TaxIdInvalid');

        case TaxIdValidationState.Complete:
          return validateTaxIdFormat(value, taxIdType)
            ? true
            : translate('Message.Account.TaxIdInvalid');

        default:
          return true;
      }
    },
    [validationState, taxIdType, translate, formState.dirtyFields],
  );

  const isFieldDisabled = validationState === TaxIdValidationState.Empty;

  return (
    <Controller
      name='accountInfo.taxId.id'
      control={control}
      defaultValue=''
      rules={{ validate: validateTaxId }}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          id='accountInfo.taxId.id'
          label={translate('Label.Account.TaxId')}
          error={!!formState.errors.accountInfo?.taxId?.id}
          helperText={formState.errors.accountInfo?.taxId?.id?.message}
          placeholder={getTaxIdPlaceholderExample(taxIdType)}
          disabled={isFieldDisabled}
        />
      )}
    />
  );
};

export default withTranslation(AccountTaxIdInput, [TranslationNamespace.CreatorAccount]);
