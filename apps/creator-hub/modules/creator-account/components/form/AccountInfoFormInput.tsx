import React, { FunctionComponent } from 'react';
import { withTranslation, useTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import AccountEntityNameInput from '../input/account/AccountEntityNameInput';
import AccountTaxIdInput from '../input/account/AccountTaxIdInput';
import AccountTaxIdTypeInput from '../input/account/AccountTaxIdTypeInput';

const AccountInfoFormInput: FunctionComponent = () => {
  const { translate } = useTranslation();

  return (
    <Grid container direction='column' gap={4}>
      <Grid container direction='column' gap={2}>
        <Grid container direction='row' spacing={3}>
          <Grid item XSmall={12}>
            <AccountEntityNameInput helperText={translate('Description.AccountEntityName')} />
          </Grid>
          <Grid item XSmall={6}>
            <AccountTaxIdTypeInput />
          </Grid>
          <Grid item XSmall={6}>
            <AccountTaxIdInput />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default withTranslation(AccountInfoFormInput, [TranslationNamespace.CreatorAccount]);
