import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import type { CreatorContactInfo } from '@rbx/client-brand-platform-api/v1';
import { withTranslation, useTranslation } from '@rbx/intl';
import { Checkbox, FormControlLabel, Grid, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { InputFormData } from '../../types';
import ContactAddress1Input from '../input/contact/ContactAddress1Input';
import ContactAddress2Input from '../input/contact/ContactAddress2Input';
import ContactAddressCityInput from '../input/contact/ContactAddressCityInput';
import ContactAddressCountryInput from '../input/contact/ContactAddressCountryInput';
import ContactAddressPostalCodeInput from '../input/contact/ContactAddressPostalCodeInput';
import ContactAddressStateInput from '../input/contact/ContactAddressStateInput';
import ContactEmailInput from '../input/contact/ContactEmailInput';
import ContactNameInput from '../input/contact/ContactNameInput';

// Address fields to sync with legal if checkbox is checked
const addressFields = ['address1', 'address2', 'postalCode', 'city', 'state', 'country'] as const;

interface InvoicingContactFormInputProps {
  countries: string[];
  legalContactInfo: Omit<CreatorContactInfo, 'contactType'> | null;
  hideCheckbox?: boolean;
  hideTitle?: boolean;
}

const InvoicingContactFormInput = ({
  countries,
  legalContactInfo,
  hideCheckbox,
  hideTitle,
}: InvoicingContactFormInputProps) => {
  const { translate } = useTranslation();
  const methods = useFormContext<InputFormData>();
  const [isSameAsLegalAddress, setIsSameAsLegalAddress] = useState(false);

  // Update form values when "same as legal address" is checked and legal address is fetched or error occurs
  useEffect(() => {
    if (!hideCheckbox && legalContactInfo && isSameAsLegalAddress) {
      // Get current address values from the form
      const currentAddress = methods.getValues('contactInfo.address');

      // Set current address values to match legalContactInfo if different
      addressFields.forEach((field) => {
        const legalValue = legalContactInfo.address[field] || '';
        const currentValue = currentAddress[field];

        if (currentValue !== legalValue) {
          methods.setValue(`contactInfo.address.${field}`, legalValue, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      });
    }
  }, [isSameAsLegalAddress, legalContactInfo, methods, hideCheckbox]);

  return (
    <Grid container direction='column' gap={4}>
      <Grid container direction='column' gap={2}>
        {!hideTitle && (
          <Grid container direction='column' gap={1} marginTop={0.25} marginBottom={2}>
            <Typography variant='h6' color='primary'>
              {translate('Heading.InvoicingInformation')}
            </Typography>
          </Grid>
        )}
        <Grid container direction='row' spacing={3}>
          <Grid item XSmall={6}>
            <ContactNameInput />
          </Grid>
          <Grid item XSmall={6}>
            <ContactEmailInput />
          </Grid>
          {!hideCheckbox && legalContactInfo && (
            <Grid item XSmall={12} marginTop={0.5} marginBottom={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isSameAsLegalAddress}
                    onChange={(e) => setIsSameAsLegalAddress(e.target.checked)}
                  />
                }
                label={translate('Label.InvoicingAddressSameAsLegal')}
              />
            </Grid>
          )}
          <Grid item XSmall={12}>
            <ContactAddress1Input disabled={isSameAsLegalAddress} />
          </Grid>
          <Grid item XSmall={12}>
            <ContactAddress2Input disabled={isSameAsLegalAddress} />
          </Grid>
          <Grid item XSmall={6}>
            <ContactAddressCityInput disabled={isSameAsLegalAddress} />
          </Grid>
          <Grid item XSmall={6}>
            <ContactAddressStateInput disabled={isSameAsLegalAddress} />
          </Grid>
          <Grid item XSmall={6}>
            <ContactAddressCountryInput countries={countries} disabled={isSameAsLegalAddress} />
          </Grid>
          <Grid item XSmall={6}>
            <ContactAddressPostalCodeInput disabled={isSameAsLegalAddress} />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default withTranslation(InvoicingContactFormInput, [TranslationNamespace.CreatorAccount]);
