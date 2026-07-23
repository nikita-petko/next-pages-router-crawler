import { Grid, makeStyles, Skeleton, TTheme } from '@rbx/ui';
import React, { FunctionComponent } from 'react';

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
