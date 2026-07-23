import { useRouter } from 'next/router';
import type { Account } from '@rbx/client-rights/v1';
import { AccountStatusEnum } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Alert, AlertTitle, Button, Grid, Typography } from '@rbx/ui';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  CommunityStandardsLink,
  RobloxTermsOfUseLink,
  TermsOfUseLink,
} from '../../../common/TermsOfUseLink';
import { ACCOUNT_HREF } from '../../urls';
import DismissableAlert from './DismissableAlert';

export interface AccountHeaderProps {
  account: Account;
}

// AccountHeader displays status information for a rights manager account (pending, rejected, etc.)
function AccountHeader({ account }: AccountHeaderProps) {
  const router = useRouter();
  const { ready, translate, translateHTML } = useTranslation();
  const {
    isFetched: isIXPFetched,
    params: { enableEditRegistration },
  } = useIXPParameters(IXPLayers.RightsManager, {
    restoreInitialValueFromCache: true,
  });

  if (!ready || !isIXPFetched) {
    return null;
  }
  const editable =
    account.status === AccountStatusEnum.Rejected ||
    account.status === AccountStatusEnum.RejectedByTtl ||
    (account.status === AccountStatusEnum.Verified && enableEditRegistration === true);

  switch (account.status || AccountStatusEnum.Rejected) {
    case AccountStatusEnum.RejectedByTtl:
    case AccountStatusEnum.Rejected:
      return (
        <Grid item direction='column' spacing={3}>
          <Alert
            severity='error'
            action={
              editable && (
                <Button color='inherit' onClick={() => router.push(ACCOUNT_HREF)}>
                  {translate('Label.EditProfile')}
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
    case AccountStatusEnum.Unverified:
      return null;
    case AccountStatusEnum.Verified:
      return <DismissableAlert />;
    case AccountStatusEnum.Disabled:
      return (
        <Grid item direction='column'>
          <Alert severity='error'>
            <AlertTitle>{translate('Heading.AccountDisabled')}</AlertTitle>
            <Typography>
              {translateHTML('Description.AccountDisabled', [
                {
                  opening: 'CSLinkStart',
                  closing: 'CSLinkEnd',
                  content(chunks) {
                    return <CommunityStandardsLink>{chunks}</CommunityStandardsLink>;
                  },
                },
                {
                  opening: 'TOSLinkStart',
                  closing: 'TOSLinkEnd',
                  content(chunks) {
                    return <TermsOfUseLink>{chunks}</TermsOfUseLink>;
                  },
                },
                {
                  opening: 'RobloxTOSLinkStart',
                  closing: 'RobloxTOSLinkEnd',
                  content(chunks) {
                    return <RobloxTermsOfUseLink>{chunks}</RobloxTermsOfUseLink>;
                  },
                },
              ])}
            </Typography>
          </Alert>
        </Grid>
      );
    default:
      return null;
  }
}

export default withTranslation(AccountHeader, [TranslationNamespace.RightsPortal]);
