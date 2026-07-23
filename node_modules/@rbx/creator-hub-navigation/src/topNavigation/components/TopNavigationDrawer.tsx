import type { FunctionComponent } from 'react';
import React from 'react';
import { makeStyles, Drawer } from '@rbx/ui';
import useNavigationConfigs from '../../hooks/useNavigationConfigs';
import { sidebarDrawerWidth } from '../constants/navigationConstants';

type TopNavigationDrawerProps = {
  className?: string;
  open: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
};

const useTopNavigationDrawerStyles = makeStyles()((theme) => ({
  drawerPaper: {
    width: '100%',
    [theme.breakpoints.up('Medium')]: {
      width: sidebarDrawerWidth,
    },
  },
  drawerPaperBelowAppBar: {
    width: sidebarDrawerWidth,
    backgroundColor: theme.palette.navigation.default,
    [theme.breakpoints.down('Medium')]: {
      maxWidth: '90%',
    },
    // better looking thin scrollbar
    scrollbarColor: 'grey transparent',
    scrollbarWidth: 'thin',
    '&::-webkit-scrollbar': {
      width: 6,
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'grey',
      borderRadius: '10rem',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
  },
  backdrop: {
    backgroundColor: theme.palette.backdropOverlay,
  },
}));

const TopNavigationDrawer: FunctionComponent<TopNavigationDrawerProps> = ({
  open,
  className,
  onClose,
  children,
}) => {
  const {
    classes: { drawerPaper, drawerPaperBelowAppBar, backdrop },
  } = useTopNavigationDrawerStyles();
  const { drawerVariant } = useNavigationConfigs();
  const useBelowAppBarStyle = drawerVariant === 'belowAppBar';
  return (
    <Drawer
      className={className}
      anchor='left'
      variant={useBelowAppBarStyle ? 'temporary' : 'persistent'}
      open={open}
      onClose={onClose}
      classes={{
        paper: useBelowAppBarStyle ? drawerPaperBelowAppBar : drawerPaper,
      }}
      BackdropProps={{
        classes: { root: backdrop },
      }}>
      {children}
    </Drawer>
  );
};

export default TopNavigationDrawer;
