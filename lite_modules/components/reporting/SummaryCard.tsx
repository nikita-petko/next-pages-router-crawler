import { Divider } from '@rbx/foundation-ui';
import { Card, CardContent, Grid } from '@rbx/ui';
import type { JSX } from 'react';

import Skeleton from '@components/common/Skeleton';
import useSummaryCardStyles from '@components/reporting/SummaryCard.styles';

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
        <span className={`text-heading-large ${noWrapText}`}>{firstValue.value}</span>
        {firstValue.units && (
          <span className={`text-body-medium content-default ${noWrapText}`}>
            {firstValue.units}
          </span>
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
          <span className={`text-heading-large ${noWrapText}`}>{secondValue.value}</span>
          {secondValue.units && (
            <span className={`text-body-medium content-default ${noWrapText}`}>
              {secondValue.units}
            </span>
          )}
        </Grid>
      </Grid>
    </>
  ) : null;

  // Always show the title - it's a static label that doesn't need skeleton loading
  const titleContent = <span className={`text-body-large ${noWrapText}`}>{title}</span>;

  const valueContent =
    isLoading && useSkeletonLoading ? (
      <>
        <Grid className={skeletonValueContainer} item>
          <Skeleton className='height-[40px] width-[70%]' data-testid='summary-card-skeleton' />
        </Grid>
        {secondValue && (
          <>
            <Grid className={metricDividerContainer} item>
              <Divider className={metricDivider} orientation='vertical' />
            </Grid>
            <Grid className={skeletonValueContainer} item>
              <Skeleton className='height-[40px] width-[70%]' data-testid='summary-card-skeleton' />
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
