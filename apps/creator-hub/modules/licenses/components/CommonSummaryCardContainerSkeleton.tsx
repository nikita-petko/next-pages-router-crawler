import type { FunctionComponent } from 'react';
import React from 'react';
import { Grid, Skeleton } from '@rbx/ui';
import useCommonSummaryCardContainerStyles from './CommonSummaryCardContainer.styles';

interface CommonSummaryCardContainerSkeletonProps {
  testId: string;
}

const CommonSummaryCardContainerSkeleton: FunctionComponent<
  React.PropsWithChildren<CommonSummaryCardContainerSkeletonProps>
> = ({ testId }) => {
  const {
    classes: { loadingThumbnail, summaryContainer, thumbnailContainer },
  } = useCommonSummaryCardContainerStyles();

  return (
    <Grid
      container
      flexDirection='column'
      className={summaryContainer}
      marginTop={1}
      data-testid={testId}>
      <Grid item className={thumbnailContainer} marginBottom={4}>
        <Skeleton animate variant='square' className={loadingThumbnail} />
      </Grid>
      <Grid item container flexDirection='column'>
        <Grid item width='15%'>
          <Skeleton animate variant='text' />
        </Grid>
        <Grid item width='15%'>
          <Skeleton animate variant='text' />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default CommonSummaryCardContainerSkeleton;
