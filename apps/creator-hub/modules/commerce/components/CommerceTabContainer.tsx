import React, { FunctionComponent, PropsWithChildren } from 'react';
import { Grid, makeStyles } from '@rbx/ui';

const useStyles = makeStyles()(() => ({
  root: {
    flexGrow: 1,
    height: '100%',
    minHeight: 560,
    marginTop: -15, // This is because there is a top padding on the page that requires this to be aligned properly
  },
}));

const CommerceTabContainer: FunctionComponent<
  PropsWithChildren<React.ComponentProps<typeof Grid>>
> = ({ children, ...props }) => {
  const { classes } = useStyles();

  return (
    <Grid
      className={classes.root}
      container
      justifyContent='center'
      alignItems='center'
      direction='column'
      {...props}>
      {children}
    </Grid>
  );
};

export default CommerceTabContainer;
