import type { Account, User } from '@rbx/client-rights/v1';
import { AccountAccountTypeEnum } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type RightsAccountFormType from '../../types/RightsAccountFormType';
import RegistrationFormView from '../registration/RegistrationFormView';

// Gets form defaults from account and user objects
function getDefaults(account: Account, user: User): RightsAccountFormType {
  const defaults: RightsAccountFormType = {
    legalName: user.fullName || '',
    organizationName: account.organizationName || '',
    accountType: account.accountType || AccountAccountTypeEnum.Individual,
    documents: [], // re-upload documents
    country: {
      name: user.country || '',
    },
    address: user.address || '',
    address2: user.address2 || '',
    city: user.city || '',
    state: user.state || '',
    postalCode: user.postalCode || '',
    accurateCheck: false,
    touCheck: false,
    signature: '', // should re-sign
  };
  return defaults;
}

export interface DetailsFormViewProps {
  onBack: () => void;
  account: Account;
  user: User;
}
const DetailsFormView = ({ onBack, account, user }: DetailsFormViewProps) => {
  const defaults = getDefaults(account, user);
  const { ready, translate } = useTranslation();
  if (!ready) {
    return null;
  }

  return (
    <Grid item>
      <Grid
        item
        container
        direction='row'
        width='100%'
        paddingBottom={3}
        justifyContent='space-between'>
        <Grid item paddingBottom={3}>
          <Typography variant='h1'>{translate('Heading.EditRegistrationForm')}</Typography>
        </Grid>
      </Grid>
      <Grid item>
        <RegistrationFormView
          customBackLabel={translate('Label.Cancel')}
          onBack={onBack}
          defaults={defaults}
        />
      </Grid>
    </Grid>
  );
};

export default withTranslation(DetailsFormView, [TranslationNamespace.RightsPortal]);
