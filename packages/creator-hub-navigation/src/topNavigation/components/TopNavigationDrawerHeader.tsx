import type { FunctionComponent } from 'react';
import React from 'react';
import { Grid, makeStyles } from '@rbx/ui';
import { topNavHeight } from '../constants/navigationConstants';

type TopNavigationDrawerHeaderProps = {
  className?: string;
  children?: React.ReactNode;
};

const useTopNavigationDrawerHeaderStyles = makeStyles()((theme) => ({
  root: {
    width: '100%',
    height: topNavHeight,
    backgroundColor: theme.palette.navigation.default,
    padding: theme.spacing(0, 1.5),
  },

  drawerPaper: {
    width: '100%',
    [theme.breakpoints.up('Medium')]: {
      width: 340,
    },
  },
}));

const TopNavigationDrawerHeader: FunctionComponent<TopNavigationDrawerHeaderProps> = ({
  className,
  children,
}) => {
  const {
    classes: { root },
    cx,
  } = useTopNavigationDrawerHeaderStyles();

  return (
    <Grid className={cx(root, className)} container alignItems='center' wrap='nowrap'>
      {children}
    </Grid>
  );
};

export default TopNavigationDrawerHeader;
