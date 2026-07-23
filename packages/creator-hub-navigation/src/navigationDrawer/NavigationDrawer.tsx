import React, { FunctionComponent, PropsWithChildren } from 'react';
import { makeStyles, Drawer } from '@rbx/ui';

type TopNavigationDrawerProps = {
  className?: string;
  open: boolean;
  onClose: VoidFunction;
};

const useTopNavigationDrawerStyles = makeStyles()((theme) => ({
  paper: {
    width: '100%',
    backgroundColor: theme.palette.navigation.global,
    [theme.breakpoints.up('Medium')]: {
      width: 340,
    },
  },

  backdrop: {
    backgroundColor: theme.palette.components.backdrop.fill,
  },

  header: {},
}));

const NavigationDrawer: FunctionComponent<PropsWithChildren<TopNavigationDrawerProps>> = ({
  open,
  className,
  onClose,
  children,
}) => {
  const {
    classes: { paper, backdrop },
  } = useTopNavigationDrawerStyles();

  return (
    <Drawer
      className={className}
      anchor='left'
      variant='temporary'
      open={open}
      onClose={onClose}
      classes={{
        paper,
      }}
      ModalProps={{
        BackdropProps: {
          classes: { root: backdrop },
        },
      }}>
      {children}
    </Drawer>
  );
};

export default NavigationDrawer;
