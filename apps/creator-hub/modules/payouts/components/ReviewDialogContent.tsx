import React, { Fragment, FunctionComponent } from 'react';
import { Typography, DialogContent, Grid, Skeleton, DialogTitle } from '@rbx/ui';
import { CreatorType } from '@modules/miscellaneous/common';
import { useTranslation } from '@rbx/intl';
import { ThumbnailWithNames } from '@modules/miscellaneous/common/components';
import { OneTimePayoutBaseV2 as OneTimePayoutBase } from '../interface/OneTimePayoutFormType';
import OneTimePayoutReviewTable from './OneTimePayoutReviewTable';

export interface ReviewDialogContentProps {
  payouts: OneTimePayoutBase[];
  currentGroup: { id: number; name: string; avatarUri?: string } | null;
}

const ReviewDialogContent: FunctionComponent<ReviewDialogContentProps> = ({
  payouts,
  currentGroup,
}) => {
  const { translate } = useTranslation();

  return (
    <Fragment>
      <DialogTitle>{translate('Title.ReviewOneTimePayout')}</DialogTitle>
      <DialogContent>
        <Grid container direction='column' gap={3}>
          <Grid item>
            <Grid container direction='column' gap={1}>
              <Grid item>
                <Typography variant='h5'>{translate('Label.From')}</Typography>
              </Grid>

              <Grid item>
                {currentGroup ? (
                  <ThumbnailWithNames
                    target={currentGroup}
                    targetType={CreatorType.Group}
                    textVariant='secondary'
                  />
                ) : (
                  <Skeleton variant='square' width={400} height={48} animate />
                )}
              </Grid>
            </Grid>
          </Grid>

          <Grid item>
            <Grid container direction='column' gap={1}>
              <Grid item>
                <Typography variant='h5'>{translate('Label.To')}</Typography>
              </Grid>

              <Grid item>
                <OneTimePayoutReviewTable payouts={payouts} />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
    </Fragment>
  );
};

export default ReviewDialogContent;
