import React, { FunctionComponent } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation, useTranslation } from '@rbx/intl';
import { Alert, AlertTitle, Button, Grid, Typography } from '@rbx/ui';
import { EmptyState } from '@modules/miscellaneous/common/components';
import { useAffiliateProgram } from '@modules/affiliate-program/providers/AffiliateProgramProvider';
import { PageLoading } from '@modules/miscellaneous/common';

type TEmptyStateProps = {
  showPayoutAlert: boolean;
  openCreateLink: VoidFunction;
};

const ShareLinkEmptyState: FunctionComponent<TEmptyStateProps> = ({
  openCreateLink,
  showPayoutAlert,
}) => {
  const { ready: areTranslationsReady, translate } = useTranslation();

  const { compliantWithAllUserRequirements, isAffiliateProgramLoading } = useAffiliateProgram();

  const isLoading = !areTranslationsReady || isAffiliateProgramLoading;

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <EmptyState title={translate('Header.CreateShareLinks')} size='large' illustration='shareLinks'>
      <Grid
        item
        maxWidth='800px'
        display='flex'
        gap='24px'
        marginBottom='24px'
        flexDirection='column'>
        <Typography color='secondary'>{translate('Description.CreateShareLinks')}</Typography>
        {/* We will only show the payout alert if the user is compliant with all requirements. */}
        {/* This check includes whether or not they own the group. */}
        {/* Their compliance with AffiliateProgram only matters if they own the group. */}
        {showPayoutAlert && compliantWithAllUserRequirements && (
          <Alert severity='success' variant='outlined'>
            <AlertTitle>{translate('Description.CreatorRewardsReceivingPayouts')}</AlertTitle>
            <Typography display='block' variant='body2' paddingTop='4px'>
              {translate('Description.GetPaid')}
            </Typography>
          </Alert>
        )}
      </Grid>
      <Button variant='contained' onClick={openCreateLink} size='large' fullWidth={false}>
        {translate('Action.CreateLink')}
      </Button>
    </EmptyState>
  );
};

export default withTranslation(ShareLinkEmptyState, [
  TranslationNamespace.ShareLinksManagement,
  TranslationNamespace.CreatorRewards,
]);
