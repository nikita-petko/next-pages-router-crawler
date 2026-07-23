import type { Account } from '@rbx/client-rights/v1';
import { AccountStatusEnum } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Alert, AlertTitle, Button, Grid, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export interface DetailsHeaderProps {
  account: Account;
  editable: boolean;
  onEdit: () => void;
}

function DetailsHeader({ account, editable, onEdit }: DetailsHeaderProps) {
  const { ready, translate } = useTranslation();
  if (!ready) {
    return null;
  }

  switch (account.status || AccountStatusEnum.Rejected) {
    case AccountStatusEnum.RejectedByTtl:
    case AccountStatusEnum.Rejected:
      return (
        <Grid item direction='column' spacing={3}>
          <Alert
            severity='error'
            action={
              editable && (
                <Button color='inherit' onClick={onEdit}>
                  {translate('Label.EditForm')}
                </Button>
              )
            }>
            <AlertTitle>{translate('Heading.RegistrationWasRejected')}</AlertTitle>
            <Typography>
              {translate('Description.RegistrationWasRejected', {
                statusReason: account.statusReason ?? 'Unknown',
              })}
            </Typography>
          </Alert>
        </Grid>
      );
    case AccountStatusEnum.Pending:
      return (
        <Grid item direction='column' spacing={3}>
          <Alert severity='info'>
            <AlertTitle>{translate('Heading.RegistrationInReview')}</AlertTitle>
            <Typography>{translate('Description.RegistrationInReview')}</Typography>
          </Alert>
        </Grid>
      );
    case AccountStatusEnum.Verified:
    case AccountStatusEnum.Disabled:
    default:
      return null;
  }
}

export default withTranslation(DetailsHeader, [TranslationNamespace.RightsPortal]);
