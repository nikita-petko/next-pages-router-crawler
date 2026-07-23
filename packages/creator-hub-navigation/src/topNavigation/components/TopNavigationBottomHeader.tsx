import React, { FunctionComponent } from 'react';
import { makeStyles, Grid, Divider } from '@rbx/ui';
import { topNavHeight } from '../constants/navigationConstants';

type TopNavigationBottomHeaderProps = {
  className?: string;
  children?: React.ReactNode;
};
const useTopNavigationBottomHeaderStyles = makeStyles()((theme) => ({
  root: {
    width: '100%',
    height: topNavHeight,
    backgroundColor: theme.palette.navigation.default,
    padding: '0 48px 0 36px',
    [theme.breakpoints.down('XLarge')]: {
      padding: '0 32px 0 20px',
    },
    [theme.breakpoints.down('Medium')]: {
      padding: '0 24px 0 12px',
    },
  },
}));

const TopNavigationBottomHeader: FunctionComponent<TopNavigationBottomHeaderProps> = ({
  className,
  children,
}) => {
  const {
    classes: { root },
    cx,
  } = useTopNavigationBottomHeaderStyles();

  return (
    <React.Fragment>
      <Grid className={cx(root, className)} container direction='row' alignItems='center'>
        {children}
      </Grid>
      <Divider />
    </React.Fragment>
  );
};

export default TopNavigationBottomHeader;
