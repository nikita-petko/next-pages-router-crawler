import { withTranslation, useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import AccountEntityNameInput from '../input/account/AccountEntityNameInput';
import AccountTaxIdInput from '../input/account/AccountTaxIdInput';
import AccountTaxIdTypeInput from '../input/account/AccountTaxIdTypeInput';
import ContactAddress1Input from '../input/contact/ContactAddress1Input';
import ContactAddress2Input from '../input/contact/ContactAddress2Input';
import ContactAddressCityInput from '../input/contact/ContactAddressCityInput';
import ContactAddressCountryInput from '../input/contact/ContactAddressCountryInput';
import ContactAddressPostalCodeInput from '../input/contact/ContactAddressPostalCodeInput';
import ContactAddressStateInput from '../input/contact/ContactAddressStateInput';
import ContactEmailInput from '../input/contact/ContactEmailInput';
import ContactNameInput from '../input/contact/ContactNameInput';

interface CommerceBusinessInfoFormInputProps {
  countries: string[];
}

/**
 * Commerce eligibility form for business info and legal contact.
 */
const CommerceBusinessInfoFormInput = ({ countries }: CommerceBusinessInfoFormInputProps) => {
  const { translate } = useTranslation();

  return (
    <Grid container direction='column' component='form' gap={4} marginTop={2} marginBottom={0}>
      <Grid container direction='column' gap={2}>
        <Typography variant='h6' color='primary' marginBottom={0.5}>
          {translate('Heading.Eligibility.GeneralInfo')}
        </Typography>
        <Grid container direction='row' spacing={3}>
          <Grid item XSmall={12}>
            <AccountEntityNameInput />
          </Grid>
          <Grid item XSmall={6}>
            <AccountTaxIdTypeInput />
          </Grid>
          <Grid item XSmall={6}>
            <AccountTaxIdInput />
          </Grid>
        </Grid>
      </Grid>
      <Grid container direction='column' gap={2}>
        <Typography variant='h6' color='primary' marginBottom={0.5}>
          {translate('Heading.Eligibility.LegalContact')}
        </Typography>
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

export default withTranslation(CommerceBusinessInfoFormInput, [
  TranslationNamespace.Commerce,
  TranslationNamespace.CreatorAccount,
]);
