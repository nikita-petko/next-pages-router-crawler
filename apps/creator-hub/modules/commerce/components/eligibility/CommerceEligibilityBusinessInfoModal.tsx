import React, { FunctionComponent, useCallback, useEffect } from 'react';
import { FormProvider } from 'react-hook-form';
import { Button, DialogActions, DialogContent, DialogTitle, CircularProgress } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import CommerceBusinessInfoFormInput from '@modules/creator-account/components/form/CommerceBusinessInfoFormInput';
import useFormMethods from '@modules/creator-account/hooks/useFormMethods';
import {
  defaultAccountInfo,
  defaultContactInfo,
  type InputFormData,
} from '@modules/creator-account/types';
import { CreatorAccountInfo, CreatorContactInfo } from '@modules/clients/brandPlatform';

export interface CommerceEligibilityBusinessInfoModalProps {
  onCancel: () => void;
  onSubmit: (data: InputFormData) => void;
  countries: string[];
  accountInfo: CreatorAccountInfo | null | undefined;
  legalContactInfo: Omit<CreatorContactInfo, 'contactType'> | null | undefined;
  isPending: boolean;
}

/**
 * Modal to prompt the user for business info.
 */
const CommerceEligibilityBusinessInfoModal: FunctionComponent<
  CommerceEligibilityBusinessInfoModalProps
> = ({ onCancel, onSubmit, countries, accountInfo, legalContactInfo, isPending }) => {
  const { translate } = useTranslation();

  const getFormDefaultValues = useCallback(() => {
    return {
      accountInfo: accountInfo ?? defaultAccountInfo,
      contactInfo: legalContactInfo ?? defaultContactInfo,
    };
  }, [accountInfo, legalContactInfo]);

  const methods = useFormMethods({ defaultValues: getFormDefaultValues() });

  // Update form values when info is updated
  useEffect(() => {
    methods.reset(
      {
        accountInfo: accountInfo ?? defaultAccountInfo,
        contactInfo: legalContactInfo ?? defaultContactInfo,
      },
      { keepDefaultValues: false },
    );
  }, [accountInfo, legalContactInfo, methods]);

  if (isPending || countries.length === 0) {
    return (
      <DialogContent>
        <CircularProgress color='secondary' />
      </DialogContent>
    );
  }

  return (
    <FormProvider {...methods}>
      <DialogTitle>{translate('Heading.Eligibility.BusinessInfo')}</DialogTitle>
      <DialogContent>
        <CommerceBusinessInfoFormInput countries={countries} />
      </DialogContent>
      <DialogActions>
        <Button
          variant='outlined'
          color='secondary'
          size='large'
          type='button'
          disabled={methods.formState.isSubmitting}
          onClick={onCancel}>
          {translate('Action.Cancel')}
        </Button>
        <Button
          variant='contained'
          size='large'
          type='submit'
          disabled={methods.formState.isSubmitting}
          loading={methods.formState.isSubmitting}
          onClick={methods.handleSubmit(onSubmit)}>
          {translate('Action.Submit')}
        </Button>
      </DialogActions>
    </FormProvider>
  );
};

export default withTranslation(CommerceEligibilityBusinessInfoModal, [
  TranslationNamespace.Commerce,
  TranslationNamespace.CreatorAccount,
]);
