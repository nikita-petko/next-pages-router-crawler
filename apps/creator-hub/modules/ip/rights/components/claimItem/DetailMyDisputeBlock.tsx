import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Dispute } from '@rbx/clients/rightsV1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography, Divider } from '@rbx/ui';
import React, { FunctionComponent } from 'react';
import disputeReasontoString from '../../helpers/getDisputeReason';

interface DetailMyDisputeBlockProps {
  dispute: Dispute;
}

const DetailMyDisputeBlock: FunctionComponent<DetailMyDisputeBlockProps> = ({ dispute }) => {
  const { translate } = useTranslation();
  if (!dispute?.reason) {
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
    </Grid>
  );
};
export default withTranslation(DetailMyDisputeBlock, [TranslationNamespace.RightsPortal]);
