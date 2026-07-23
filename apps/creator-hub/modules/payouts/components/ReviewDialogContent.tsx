import type { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography, DialogContent, Grid, Skeleton, DialogTitle } from '@rbx/ui';
import type { NormalizedEstimatedFiat } from '@modules/devex/global/cashOut/utils/devexWatermarkUtil';
import { CreatorType } from '@modules/miscellaneous/common';
import ThumbnailWithNames from '@modules/miscellaneous/components/ThumbnailWithNames';
import type { OneTimePayoutBaseV2 as OneTimePayoutBase } from '../interface/OneTimePayoutFormType';
import OneTimePayoutReviewTable from './OneTimePayoutReviewTable';

export interface ReviewDialogContentProps {
  payouts: OneTimePayoutBase[];
  currentGroup: { id: number; name: string; avatarUri?: string } | null;
  normalizedWatermarks?: NormalizedEstimatedFiat;
}

const ReviewDialogContent: FunctionComponent<ReviewDialogContentProps> = ({
  payouts,
  currentGroup,
  normalizedWatermarks,
}) => {
  const { translate } = useTranslation();

  return (
    <>
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
                <OneTimePayoutReviewTable
                  payouts={payouts}
                  normalizedWatermarks={normalizedWatermarks}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
    </>
  );
};

export default ReviewDialogContent;
