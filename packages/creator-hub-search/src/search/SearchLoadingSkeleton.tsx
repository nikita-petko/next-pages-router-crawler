import type { FunctionComponent } from 'react';
import React from 'react';
import type { TTheme } from '@rbx/ui';
import { Grid, makeStyles, Skeleton } from '@rbx/ui';

const useSkeletonStyles = makeStyles()((theme: TTheme) => ({
  container: {
    paddingBottom: '6px',
  },
  skeleton: {
    borderRadius: theme.shape.borderRadius,
    margin: '6px 12px',
  },
}));

const SearchLoadingSkeleton: FunctionComponent<React.PropsWithChildren> = () => {
  const { classes } = useSkeletonStyles();

  return (
    <Grid container direction='column' className={classes.container}>
      {Array.from({ length: 7 }, (_, index) => (
        <Grid item key={index}>
          <Skeleton variant='rectangular' height={48} className={classes.skeleton} />
        </Grid>
      ))}
    </Grid>
  );
};

export default SearchLoadingSkeleton;
