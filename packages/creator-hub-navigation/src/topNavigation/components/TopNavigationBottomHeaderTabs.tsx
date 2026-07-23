import React, { FunctionComponent } from 'react';
import { makeStyles, Tabs, TTabsProps } from '@rbx/ui';
import { topNavHeight } from '../constants/navigationConstants';

type TopNavigationBottomHeaderTabsProps = {
  allowScrollButtonsMobile?: boolean;
  className?: string;
  value?: TTabsProps['value'];
  variant?: TTabsProps['variant'];
  children?: React.ReactNode;
};
const useStyles = makeStyles()(theme => ({
  root: {
    width: '100%',
    height: topNavHeight,
    backgroundColor: theme.palette.navigation.default,
    '& [role=tab]': {
      height: topNavHeight,
      minWidth: 0,
      margin: theme.spacing(0, 1)
    }
  }
}));

const TopNavigationBottomHeaderTabs: FunctionComponent<TopNavigationBottomHeaderTabsProps> = ({
  allowScrollButtonsMobile,
  className,
  variant,
  value,
  children
}) => {
  const {
    classes: { root },
    cx
  } = useStyles();

  return (
    <Tabs
      allowScrollButtonsMobile={allowScrollButtonsMobile}
      className={cx(root, className)}
      variant={variant}
      value={value}
      orientation='horizontal'>
      {children}
    </Tabs>
  );
};

export default TopNavigationBottomHeaderTabs;
