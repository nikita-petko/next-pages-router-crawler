import type { Account, User } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Button } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import RegistrationStaticView from '../registration/RegistrationStaticView';

export interface DetailsStaticViewProps {
  editable: boolean;
  onEdit: () => void;
  account: Account;
  user: User;
}
const DetailsStaticView = ({ editable, onEdit, account, user }: DetailsStaticViewProps) => {
  const { ready, translate } = useTranslation();
  if (!ready) {
    return null;
  }

  return (
    <Grid item>
      {editable && (
        <Grid container item XSmall={12} sx={{ justifyContent: 'flex-start' }} paddingBottom={3}>
          <Button variant='contained' color='primaryBrand' size='medium' onClick={onEdit}>
            {translate('Action.Edit')}
          </Button>
        </Grid>
      )}
      <RegistrationStaticView account={account} user={user} />
    </Grid>
  );
};

export default withTranslation(DetailsStaticView, [TranslationNamespace.RightsPortal]);
