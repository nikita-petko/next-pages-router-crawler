import React from 'react';
import { Grid, IconButton, makeStyles, MenuIcon, MenuOpenIcon, Typography } from '@rbx/ui';
import { useRobloxAuthentication } from '@rbx/auth';
import { HubSearchIcon } from '@rbx/creator-hub-search';
import { useRailContext } from '../providers/RailProvider';

import Assistant from './Assistant';
import { NotificationBellV2 as NotificationBell } from '../../notificationTray/NotificationBell';
import AuthenticationStatusContainer, { TMenuItem } from './AuthenticationStatusContainer';
import { HEADER_GRID_AREA, MAX_CONTENT_WIDTH } from '../constants';

const useStyles = makeStyles()((theme) => ({
  header: {
    fontSize: '24px',
    fontWeight: 600,
    gridArea: HEADER_GRID_AREA,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '12px 32px',
    justifyContent: 'center',
    width: '100%',
    [theme.breakpoints.down('Medium')]: {
      padding: '8px 20px',
    },
  },
  container: {
    maxWidth: MAX_CONTENT_WIDTH + 8,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  subItem: {
    height: '100%',
    display: 'flex',
    gap: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    // Accounting for the icon padding. Making the left side of the icon align with the content instead of the button.
    marginLeft: '-8px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    [theme.breakpoints.down('Medium')]: {
      gap: 4,
    },
  },
  hamburgerTitle: {
    marginLeft: '0px',
  },
}));

type THeaderProps = {
  menuItems?: TMenuItem[];
  onLogout?: VoidFunction;
};
const Header: React.FC<React.PropsWithChildren<THeaderProps>> = ({
  children,
  menuItems,
  onLogout,
}) => {
  const {
    cx,
    classes: { header, subItem, title, hamburgerTitle, container },
  } = useStyles();
  const { primaryRailOpen, drawerVariant, setPrimaryRailOpen } = useRailContext();
  const { user } = useRobloxAuthentication();

  return (
    <Grid classes={{ root: header }}>
      <Grid classes={{ root: container }}>
        <Grid
          classes={{
            root: cx(title, {
              [hamburgerTitle]: drawerVariant === 'persistent' && false,
            }),
          }}>
          <IconButton
            color='secondary'
            aria-label='menu'
            onClick={() => setPrimaryRailOpen(!primaryRailOpen)}>
            {primaryRailOpen ? <MenuOpenIcon /> : <MenuIcon />}
          </IconButton>
          <Typography variant='h3'>{children}</Typography>
        </Grid>
        <Grid classes={{ root: subItem }}>
          <Assistant user={user} />
          <HubSearchIcon />
          <NotificationBell user={user} size='medium' />
          <AuthenticationStatusContainer onLogout={onLogout} menuItems={menuItems} />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Header;
