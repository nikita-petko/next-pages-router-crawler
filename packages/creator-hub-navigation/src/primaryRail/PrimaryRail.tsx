import type { PropsWithChildren } from 'react';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useRobloxAuthentication } from '@rbx/auth';
import { Drawer, Grid, makeStyles, paperClasses } from '@rbx/ui';
import AllTools from '../components/AllTools/AllTools';
import { clickToolsEventModel } from '../event/eventConstants';
import useNavigationConfigs from '../hooks/useNavigationConfigs';
import useScrollStyles from '../hooks/useScrollStyles';
import {
  COMPACT_TRANSITION_DURATION,
  PRIMARY_RAIL_COLLAPSE_WIDTH,
  PRIMARY_RAIL_GRID_AREA,
  PRIMARY_RAIL_WIDTH,
  PRIMARY_RAIL_DRAWER_Z_INDEX,
  PRIMARY_RAIL_Z_INDEX,
  RAIL_DIVIDER_WIDTH,
  RAIL_HORIZONTAL_PADDING,
} from '../layout/constants';
import { useRailContext } from '../layout/providers/RailProvider';
import type { TSendEvent } from '../providers/EventProvider';
import { useEventLogger } from '../providers/EventProvider';
import PrimaryRailContent from './components/PrimaryRailContent';

const SECONDARY_RAIL_WIDTH = 216;
/** Creations → experiences L3 secondary rail — pre-L1-nav width. */
const SECONDARY_RAIL_WIDTH_EXPERIENCE = 235;
const SECONDARY_RAIL_WIDTH_MEDIUM = 293;
const SECONDARY_RAIL_WIDTH_LARGE = 330;
const useStyles = makeStyles()((theme) => ({
  container: {
    gridArea: PRIMARY_RAIL_GRID_AREA,
    zIndex: PRIMARY_RAIL_Z_INDEX,
  },
  rails: {
    display: 'flex',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    maxWidth: 700,
    borderRight: `${RAIL_DIVIDER_WIDTH}px solid ${theme.palette.components.divider}`,
  },
  railsTransition: {
    transition: `all ${theme.transitions.duration.shortest}ms ease-out`,
  },

  railsClosed: {
    maxWidth: 0,
  },
  drawer: {
    zIndex: PRIMARY_RAIL_DRAWER_Z_INDEX,
  },
  drawerPaper: {
    backgroundColor: theme.palette.navigation.default,
    backgroundImage: 'none',
    overflow: 'hidden',
    borderRight: 'none',
  },
  docked: {
    height: '100%',
    [`& > .${paperClasses.root}`]: {
      position: 'relative',
      borderRight: 'none',
    },
  },
  secondaryRail: {
    position: 'relative',
    height: '100%',
    width: SECONDARY_RAIL_WIDTH,
    // Equal 16px gutters on both sides (border sits outside the padded content).
    padding: RAIL_HORIZONTAL_PADDING,
    minWidth: 0,
    borderLeft: `${RAIL_DIVIDER_WIDTH}px solid ${theme.palette.components.divider}`,
    overscrollBehavior: 'none',
  },
  experienceSecondaryRail: {
    width: SECONDARY_RAIL_WIDTH_EXPERIENCE,
  },
  largeSecondaryRail: {
    width: SECONDARY_RAIL_WIDTH_LARGE,
  },
  mediumSecondaryRail: {
    width: SECONDARY_RAIL_WIDTH_MEDIUM,
  },
}));

type TPrimaryRailProps = {
  sendEvent: TSendEvent;
  openStudio: VoidFunction;
  pathname: string;
  secondarySize?: 'small' | 'medium' | 'large' | 'experience';
};

export const PrimaryRail: React.FC<PropsWithChildren<TPrimaryRailProps>> = ({
  pathname,
  secondarySize = 'small',
  openStudio,
  sendEvent,
  children,
}) => {
  const {
    primaryRailOpen,
    primaryRailCompact,
    iconOnly,
    allToolsOpen,
    drawerVariant,
    setHasSecondaryRail,
    setLearnNavigatedFromCreatorHub,
    setPrimaryRailOpen,
    setAllToolsOpen,
  } = useRailContext();

  const compact = primaryRailCompact || iconOnly;

  const hasChildren = Boolean(children);
  const { login, isFetched, user } = useRobloxAuthentication();
  const router = useRouter();
  const { currentProduct } = useNavigationConfigs();

  const slideProps = useMemo(() => {
    const onTransition = (node: HTMLElement) => {
      node.style.transition = 'none';
    };
    return {
      onEntering: onTransition,
      onExiting: onTransition,
    };
  }, []);

  const innerSlideProps = useMemo(() => {
    return {
      onEntering: (node: HTMLElement) => {
        node.style.transition = `left ${COMPACT_TRANSITION_DURATION}ms ease-out`;
      },
      onExiting: (node: HTMLElement) => {
        node.style.transition = 'none';
      },
    };
  }, []);

  useEffect(() => {
    const {
      pathname: routerPathname,
      query: { navFromCreatorHub, ...query },
    } = router;
    if (router.isReady && navFromCreatorHub !== undefined) {
      if (navFromCreatorHub === 'true' && ['Documentation', 'Assistant'].includes(currentProduct)) {
        setLearnNavigatedFromCreatorHub();
      }
      void router.replace({ pathname: routerPathname, query }, undefined, { shallow: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run once when router is ready
  }, [router.isReady]);

  const {
    cx,
    classes: {
      container,
      rails,
      drawerPaper,
      drawer,
      railsClosed,
      docked,
      secondaryRail,
      experienceSecondaryRail,
      mediumSecondaryRail,
      largeSecondaryRail,
    },
  } = useStyles();

  const {
    classes: { scroll },
  } = useScrollStyles();

  const closeTools = useCallback(() => {
    setAllToolsOpen(false);
    if (drawerVariant === 'temporary') {
      setPrimaryRailOpen(false);
    }
  }, [drawerVariant, setAllToolsOpen, setPrimaryRailOpen]);

  const onToolSelect = useCallback(
    (key: string, searchTerm?: string) => {
      sendEvent(clickToolsEventModel(key, searchTerm));
      closeTools();
    },
    [closeTools, sendEvent],
  );

  useEffect(() => {
    setHasSecondaryRail(hasChildren);
  }, [hasChildren, setHasSecondaryRail]);

  return (
    <Grid classes={{ root: container }}>
      <Drawer
        open={primaryRailOpen}
        variant={drawerVariant}
        onClose={() => setPrimaryRailOpen(false)}
        classes={{ docked }}
        SlideProps={slideProps}
        PaperProps={{
          classes: { root: drawerPaper },
        }}>
        <Grid className={cx(rails, cx({ [railsClosed]: !primaryRailOpen }))}>
          <Grid>
            <PrimaryRailContent
              isAuth={Boolean(user)}
              isLoading={!isFetched}
              login={login}
              pathname={pathname}
              openStudio={openStudio}
              sendEvent={sendEvent}
            />
          </Grid>
          {children && (
            <Grid
              classes={{
                root: cx(secondaryRail, scroll, {
                  [experienceSecondaryRail]: secondarySize === 'experience',
                  [mediumSecondaryRail]: secondarySize === 'medium',
                  [largeSecondaryRail]: secondarySize === 'large',
                }),
              }}>
              {children}
            </Grid>
          )}
        </Grid>
        <Drawer
          disablePortal
          open={allToolsOpen}
          onClose={closeTools}
          classes={{ root: drawer }}
          SlideProps={innerSlideProps}
          PaperProps={{
            classes: { root: drawerPaper },
            sx: {
              left: compact ? PRIMARY_RAIL_COLLAPSE_WIDTH : PRIMARY_RAIL_WIDTH,
              transition: `left ${COMPACT_TRANSITION_DURATION}ms ease-out`,
            },
          }}>
          <AllTools onToolSelect={onToolSelect} onClose={() => setAllToolsOpen(false)} />
        </Drawer>
      </Drawer>
    </Grid>
  );
};

const PrimaryRailContainer: React.FC<
  Omit<TPrimaryRailProps, 'pathname' | 'sendEvent'> & { children?: React.ReactNode }
> = ({ children, ...props }) => {
  const sendEvent = useEventLogger();
  const { pathname } = useRouter();

  return (
    <PrimaryRail pathname={pathname} sendEvent={sendEvent} {...props}>
      {children}
    </PrimaryRail>
  );
};

export default PrimaryRailContainer;
