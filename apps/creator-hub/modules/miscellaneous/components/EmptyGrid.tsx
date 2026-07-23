import type { FunctionComponent } from 'react';
import React from 'react';
import { Grid, makeStyles } from '@rbx/ui';

const useEmptyGridStyles = makeStyles()({
  empty: {
    flexGrow: 1,
    height: '100%',
    minHeight: '200px', // Necessary for mobile
  },
});

export const EmptyGrid: FunctionComponent<React.PropsWithChildren> = (props) => {
  const {
    classes: { empty },
  } = useEmptyGridStyles();
  const { children } = props;
  return (
    <Grid
      classes={{ root: empty }}
      container
      justifyContent='center'
      alignItems='center'
      direction='column'>
      {children}
    </Grid>
  );
};

export default EmptyGrid;
