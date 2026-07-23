import React, { FunctionComponent } from 'react';
import { Grid, makeStyles, Divider } from '@rbx/ui';

const useStyles = makeStyles()(() => ({
  root: {
    padding: '16px 0'
  }
}));

const TopNavigationSidebarHeader: FunctionComponent<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className, children }) => {
  const {
    classes: { root },
    cx
  } = useStyles();

  return (
    <React.Fragment>
      <Grid className={cx(root, className)} container alignItems='center'>
        {children}
      </Grid>
      <Divider />
    </React.Fragment>
  );
};

export default TopNavigationSidebarHeader;
