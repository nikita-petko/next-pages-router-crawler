import { FormProvider } from 'react-hook-form';
import { withTranslation, useTranslation } from '@rbx/intl';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  DialogContentText,
  CircularProgress,
} from '@rbx/ui';
import type { CreatorContactInfo } from '@modules/clients/brandPlatform';
import InvoicingInfoFormInput from '@modules/creator-account/components/form/InvoicingContactFormInput';
import useFormMethods from '@modules/creator-account/hooks/useFormMethods';
import { defaultContactInfo, type InputFormData } from '@modules/creator-account/types';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

interface CommerceEligibilityInvoicingInfoModalProps {
  onCancel: () => void;
  onSubmit: (data: InputFormData) => void;
  countries: string[];
  legalContactInfo: Omit<CreatorContactInfo, 'contactType'> | null | undefined;
}

const CommerceEligibilityInvoicingInfoModal = ({
  onCancel,
  onSubmit,
  countries,
  legalContactInfo,
}: CommerceEligibilityInvoicingInfoModalProps) => {
  const { translate } = useTranslation();

  const methods = useFormMethods({ defaultValues: { contactInfo: defaultContactInfo } });

  if (legalContactInfo === undefined || countries.length === 0) {
    return (
      <DialogContent>
        <CircularProgress color='secondary' />
      </DialogContent>
    );
  }

  return (
    <FormProvider {...methods}>
      <DialogTitle>{translate('Heading.Eligibility.InvoicingInfo')}</DialogTitle>
      <DialogContent>
        <DialogContentText marginTop={2} marginBottom={4}>
          <Typography variant='body1' color='secondary'>
            {translate('Description.Eligibility.InvoicingInfo')}
          </Typography>
        </DialogContentText>
        <InvoicingInfoFormInput
          countries={countries}
          legalContactInfo={legalContactInfo}
          hideTitle
        />
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

export default withTranslation(CommerceEligibilityInvoicingInfoModal, [
  TranslationNamespace.Commerce,
  TranslationNamespace.CreatorAccount,
]);
