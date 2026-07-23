import React, { Fragment, FunctionComponent } from 'react';
import { DialogContent, DialogTitle, Grid, Typography, WarningIcon } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { OneTimePayoutBaseV2 as OneTimePayoutBase } from '../interface/OneTimePayoutFormType';
import OneTimePayoutReviewTable from './OneTimePayoutReviewTable';

export interface FirstPayoutWarningDialogContentProps {
  firstTimePayouts: OneTimePayoutBase[];
}

/**
 * Dialog content for warning about first-time payout recipients.
 * Shows only the users receiving their first payout with a warning message.
 */
const FirstPayoutWarningDialogContent: FunctionComponent<FirstPayoutWarningDialogContentProps> = ({
  firstTimePayouts,
}) => {
  const { translate } = useTranslation();

  return (
    <Fragment>
      <DialogTitle>
        <Grid container alignItems='center' gap={2}>
          <WarningIcon color='warning' fontSize='large' />
          <Typography variant='h4'>{translate('Title.ConfirmFirstTimePayout')}</Typography>
        </Grid>
      </DialogTitle>
      <DialogContent>
        <Grid container gap={2}>
          <Grid item>
            {/* To align the content with the header text */}
            <WarningIcon fontSize='large' sx={{ visibility: 'hidden' }} />
          </Grid>
          <Grid item sx={{ flex: 1 }}>
            <Grid container direction='column' gap={3}>
              <Grid item>
                <Typography variant='body1' whiteSpace='pre-line'>
                  {translate('Description.FirstTimePayoutWarning')}
                </Typography>
              </Grid>
              <Grid item>
                <OneTimePayoutReviewTable payouts={firstTimePayouts} />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
    </Fragment>
  );
};

export default FirstPayoutWarningDialogContent;
