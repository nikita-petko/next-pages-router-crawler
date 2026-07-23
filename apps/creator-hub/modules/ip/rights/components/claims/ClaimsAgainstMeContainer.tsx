import React from 'react';
import { Grid, Typography } from '@rbx/ui';
import { Account } from '@rbx/clients/rightsV1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PageLoading } from '@modules/miscellaneous/common';
import RightsApiErrorView from '../error/RightsApiErrorView';
import useListIncomingClaimItems from '../../hooks/useListIncomingClaimItems';
import EmptyClaimsAgainstMeView from './EmptyClaimsAgainstMeView';
import ClaimsAgainstMeTable from './ClaimsAgainstMeTable';

export enum FilterOption {
  All = 1,
  Disputed,
  Escalated,
}

/**
 *  ClaimsAgainstMeContainer controls a ClaimsAgainstMeTable, displaying
 */
const ClaimsAgainstMeContainer = ({ account }: { account: Account }) => {
  const { ready, translate } = useTranslation();
  const { claimItemGroups, error } = useListIncomingClaimItems(account.id || '', 1, '');
  const isEmpty = claimItemGroups.length === 0;
  if (!ready) {
    return <PageLoading />;
  }

  if (error) {
    return <RightsApiErrorView errorResponse={error} />;
  }

  if (isEmpty) {
    return <EmptyClaimsAgainstMeView />;
  }
  return (
    <Grid container direction='column' spacing={3}>
      <Grid item>
        <Typography color='secondary'>{translate('Description.ClaimFlavor')}</Typography>
      </Grid>
      <Grid item>
        <ClaimsAgainstMeTable account={account} />
      </Grid>
    </Grid>
  );
};

export default withTranslation(ClaimsAgainstMeContainer, [
  TranslationNamespace.GameLocalizationTranslators,
  TranslationNamespace.Creations,
  TranslationNamespace.DeveloperItem,
  TranslationNamespace.Error,
  TranslationNamespace.RightsPortal,
]);
