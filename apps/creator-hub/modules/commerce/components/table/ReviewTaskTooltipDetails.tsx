import type {
  CommerceProductBundlingFeeModel,
  CommerceProductReviewTaskModel,
} from '@rbx/client-commerce-api/v1';
import { CommerceProductBundlingFeeStatus, ProductReviewType } from '@rbx/client-commerce-api/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { HourglassEmptyIcon, CheckIcon, Grid, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CommerceTranslationKeys } from '../../constants';

interface ReviewTaskTooltipDetailsProps {
  reviewTasks: CommerceProductReviewTaskModel[] | null | undefined;
  bundlingFee: CommerceProductBundlingFeeModel | null | undefined;
}

const ReviewTaskTooltipDetails = ({ reviewTasks, bundlingFee }: ReviewTaskTooltipDetailsProps) => {
  const { translate } = useTranslation();

  if (reviewTasks === null || reviewTasks === undefined) {
    return null;
  }

  const hasModerationTask = reviewTasks.some(
    (task) => task.reviewType === ProductReviewType.NUMBER_2,
  );

  const hasBundlingFeeReviewTask = reviewTasks.some(
    (task) => task.reviewType === ProductReviewType.NUMBER_1,
  );

  return (
    <Grid container direction='column' alignItems='left' gap={0.5} wrap='nowrap'>
      <Grid item alignItems='center' display='flex' gap={0.5}>
        {hasModerationTask ? <HourglassEmptyIcon /> : <CheckIcon />}
        <Typography variant='captionHeader'>
          {translate(CommerceTranslationKeys.Moderation)}
        </Typography>
      </Grid>
      {bundlingFee && (
        <Grid item alignItems='center' display='flex' gap={0.5}>
          {hasBundlingFeeReviewTask &&
          bundlingFee.status === CommerceProductBundlingFeeStatus.NUMBER_2 ? (
            <HourglassEmptyIcon />
          ) : (
            <CheckIcon />
          )}
          <Typography variant='captionHeader'>
            {translate(CommerceTranslationKeys.PendingBundlingFee)}
          </Typography>
        </Grid>
      )}
    </Grid>
  );
};

export default withTranslation(ReviewTaskTooltipDetails, [TranslationNamespace.Commerce]);
