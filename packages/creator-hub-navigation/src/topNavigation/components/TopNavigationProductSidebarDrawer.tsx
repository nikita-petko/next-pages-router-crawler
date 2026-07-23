import React, { FunctionComponent } from 'react';
import { makeStyles, Grid, Button, ArrowBackIcon, IconButton, CloseIcon } from '@rbx/ui';
import TopNavigationDrawer from './TopNavigationDrawer';
import TopNavigationDrawerHeader from './TopNavigationDrawerHeader';
import NavigationTranslate from '../../hooks/NavigationTranslate';

type TopNavigationProductSidebarDrawerProps = {
  open: boolean;
  onClickBack: () => void;
  onClickClose: () => void;
  children?: React.ReactNode;
};
const useTopNavigationProductSidebarDrawerStyles = makeStyles()(theme => ({
  drawerContent: {
    padding: theme.spacing(2, 3),
    flexGrow: 1
  }
}));

const TopNavigationProductSidebarDrawer: FunctionComponent<
  TopNavigationProductSidebarDrawerProps
> = ({ open, onClickClose, onClickBack, children }) => {
  const {
    classes: { drawerContent }
  } = useTopNavigationProductSidebarDrawerStyles();

  return (
    <TopNavigationDrawer open={open} onClose={onClickClose}>
      <TopNavigationDrawerHeader>
        <Grid container alignItems='center' wrap='nowrap' justifyContent='space-between'>
          <Grid container alignItems='center'>
            <Button startIcon={<ArrowBackIcon />} onClick={onClickBack}>
              <NavigationTranslate content='Heading.Creator' />
            </Button>
          </Grid>
          <Grid item>
            <IconButton color='secondary' aria-label='close' onClick={onClickClose} size='large'>
              <CloseIcon />
            </IconButton>
          </Grid>
        </Grid>
      </TopNavigationDrawerHeader>
      <div className={drawerContent}>{children}</div>
    </TopNavigationDrawer>
  );
};

export default TopNavigationProductSidebarDrawer;
