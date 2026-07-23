import React, { FunctionComponent } from 'react';
import { withTranslation, useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ContactAddress1Input from '../input/contact/ContactAddress1Input';
import ContactAddress2Input from '../input/contact/ContactAddress2Input';
import ContactAddressCityInput from '../input/contact/ContactAddressCityInput';
import ContactAddressCountryInput from '../input/contact/ContactAddressCountryInput';
import ContactAddressPostalCodeInput from '../input/contact/ContactAddressPostalCodeInput';
import ContactAddressStateInput from '../input/contact/ContactAddressStateInput';
import ContactEmailInput from '../input/contact/ContactEmailInput';
import ContactNameInput from '../input/contact/ContactNameInput';

export interface InvoicingContactFormInputProps {
  countries: string[];
}

const InvoicingContactFormInput: FunctionComponent<InvoicingContactFormInputProps> = ({
  countries,
}) => {
  const { translate } = useTranslation();

  return (
    <Grid container direction='column' gap={4}>
      <Grid container direction='column' gap={2}>
        <Grid container direction='column' gap={1} marginTop={0.25} marginBottom={2}>
          <Typography variant='h6' color='primary'>
            {translate('Heading.LegalAddress')}
          </Typography>
          <Typography variant='body2' color='secondary'>
            {translate('Description.LegalAddress')}
          </Typography>
        </Grid>
        <Grid container direction='row' spacing={3}>
          <Grid item XSmall={6}>
            <ContactNameInput />
          </Grid>
          <Grid item XSmall={6}>
            <ContactEmailInput />
          </Grid>
          <Grid item XSmall={12}>
            <ContactAddress1Input />
          </Grid>
          <Grid item XSmall={12}>
            <ContactAddress2Input />
          </Grid>
          <Grid item XSmall={6}>
            <ContactAddressCityInput />
          </Grid>
          <Grid item XSmall={6}>
            <ContactAddressStateInput />
          </Grid>
          <Grid item XSmall={6}>
            <ContactAddressCountryInput countries={countries} />
          </Grid>
          <Grid item XSmall={6}>
            <ContactAddressPostalCodeInput />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default withTranslation(InvoicingContactFormInput, [TranslationNamespace.CreatorAccount]);
