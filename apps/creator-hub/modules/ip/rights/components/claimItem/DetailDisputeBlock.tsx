import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography, Divider, DescriptionIcon } from '@rbx/ui';
import React, { FunctionComponent } from 'react';
import { PageLoading } from '@modules/miscellaneous/common';
import useDisputeByClaimItem from '../../hooks/useDisputeByClaimItem';
import disputeReasontoString from '../../helpers/getDisputeReason';

interface DetailDisputeBlockProps {
  claimItemId: string;
  accountId: string;
}

const DetailDisputeBlock: FunctionComponent<DetailDisputeBlockProps> = ({
  claimItemId,
  accountId,
}) => {
  const { translate } = useTranslation();
  const {
    dispute,
    isPending: disputeLoading,
    error: disputeError,
  } = useDisputeByClaimItem(accountId, claimItemId);
  if (disputeLoading) {
    return <PageLoading />;
  }

  if (disputeError || !dispute || !dispute?.reason) {
    return null;
  }
  const reason = disputeReasontoString(dispute.reason, translate);

  return (
    <Grid item XSmall={12} container direction='column' rowSpacing={3}>
      <Grid item>
        <Divider />
      </Grid>
      <Grid item>
        <Typography variant='h6'>{translate('Heading.DisputeDetails')}</Typography>
      </Grid>
      <Grid item container>
        <Grid item XSmall={12}>
          <Typography variant='body2' color='secondary'>
            {translate('Label.Reason')}
          </Typography>
        </Grid>
        <Grid item XSmall={12}>
          <Typography variant='body2'>{reason}</Typography>
        </Grid>
      </Grid>
      {dispute?.description && dispute?.description.length > 0 && (
        <Grid item container>
          <Grid item XSmall={12}>
            <Typography variant='body2' color='secondary'>
              {translate('Label.Rationale')}
            </Typography>
          </Grid>
          <Grid item XSmall={12}>
            <Typography variant='body2'>{dispute?.description}</Typography>
          </Grid>
        </Grid>
      )}
      {dispute?.documents && dispute?.documents.length > 0 && (
        <Grid item container rowSpacing={1}>
          <Grid item XSmall={12}>
            <Typography variant='body2' color='secondary'>
              {translate('Description.SupportingDocumentation')}
            </Typography>
          </Grid>
          <Grid item container XSmall={12} rowSpacing={1}>
            {dispute?.documents?.map((document) => {
              return (
                <Grid item container key={document.id} columnSpacing={2}>
                  <Grid item>
                    <DescriptionIcon color='secondary' />
                  </Grid>
                  <Grid item>
                    <Typography variant='body2'>{document.name}</Typography>
                  </Grid>
                </Grid>
              );
            })}
          </Grid>
        </Grid>
      )}
    </Grid>
  );
};
export default withTranslation(DetailDisputeBlock, [TranslationNamespace.RightsPortal]);
