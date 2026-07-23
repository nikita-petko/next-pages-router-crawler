import { Divider } from '@rbx/foundation-ui';
import { Card, CardContent, Grid, Skeleton, Typography } from '@rbx/ui';
import type { JSX } from 'react';

import useSummaryCardStyles from '@components/reporting/SummaryCard.styles';
import {
  SUMMARY_CARD_VALUE_SKELETON_HEIGHT,
  SUMMARY_CARD_VALUE_SKELETON_WIDTH,
} from '@constants/genericManagementTableStyles';

interface SummaryCardValue {
  units?: string;
  value: JSX.Element;
}

interface SummaryCardProps {
  firstValue: SummaryCardValue;
  isLoading?: boolean;
  secondValue?: SummaryCardValue;
  title: string;
  useSkeletonLoading?: boolean;
}

const SummaryCard = ({
  firstValue,
  isLoading,
  secondValue,
  title,
  useSkeletonLoading = false,
}: SummaryCardProps) => {
  const {
    classes: {
      cardContainer,
      cardContainerWithMultiple,
      cardContentContainer,
      metricCard,
      metricDivider,
      metricDividerContainer,
      multipleStatsContainer,
      noWrapText,
      skeletonValueContainer,
      statContainer,
    },
    cx,
  } = useSummaryCardStyles();

  const firstSection = (
    <Grid item>
      <Grid className={statContainer} container>
        <Typography className={noWrapText} variant='h1'>
          {firstValue.value}
        </Typography>
        {firstValue.units && (
          <Typography className={noWrapText} color='secondary' variant='body2'>
            {firstValue.units}
          </Typography>
        )}
      </Grid>
    </Grid>
  );

  const secondSection = secondValue ? (
    <>
      <Grid className={metricDividerContainer} item>
        <Divider className={metricDivider} orientation='vertical' />
      </Grid>
      <Grid item>
        <Grid className={statContainer} container>
          <Typography className={noWrapText} variant='h1'>
            {secondValue.value}
          </Typography>
          {secondValue.units && (
            <Typography className={noWrapText} color='secondary' variant='body2'>
              {secondValue.units}
            </Typography>
          )}
        </Grid>
      </Grid>
    </>
  ) : null;

  // Always show the title - it's a static label that doesn't need skeleton loading
  const titleContent = (
    <Typography className={noWrapText} variant='body1'>
      {title}
    </Typography>
  );

  const valueContent =
    isLoading && useSkeletonLoading ? (
      <>
        <Grid className={skeletonValueContainer} item>
          <Skeleton
            animate
            data-testid='summary-card-skeleton'
            height={SUMMARY_CARD_VALUE_SKELETON_HEIGHT}
            variant='text'
            width={SUMMARY_CARD_VALUE_SKELETON_WIDTH}
          />
        </Grid>
        {secondValue && (
          <>
            <Grid className={metricDividerContainer} item>
              <Divider className={metricDivider} orientation='vertical' />
            </Grid>
            <Grid className={skeletonValueContainer} item>
              <Skeleton
                animate
                data-testid='summary-card-skeleton'
                height={SUMMARY_CARD_VALUE_SKELETON_HEIGHT}
                variant='text'
                width={SUMMARY_CARD_VALUE_SKELETON_WIDTH}
              />
            </Grid>
          </>
        )}
      </>
    ) : (
      <>
        {firstSection}
        {secondSection}
      </>
    );

  return (
    <Grid
      className={cx({
        [cardContainer]: !secondValue,
        [cardContainerWithMultiple]: !!secondValue,
      })}
      item>
      <Card className={metricCard} variant='filled'>
        <CardContent className={cardContentContainer}>
          <Grid container direction='column' rowGap='4px'>
            <Grid item>{titleContent}</Grid>
            <Grid item>
              <Grid className={multipleStatsContainer} container direction='row'>
                {valueContent}
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default SummaryCard;
