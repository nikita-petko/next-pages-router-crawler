import { makeStyles } from '@rbx/ui';
import { topNavigationHeights } from '../../layout/components/Layout.styles';

const PRIMARY_SIDEBAR_WIDTH = 282;
const PRIMARY_SIDEBAR_PADDING = 24;
const COLLAPSED_PRIMARY_SIDEBAR_PADDING = 12;
const SECONDARY_SIDEBAR_WIDTH = 330;
const COLLAPSED_SIDEBAR_WIDTH = 64;
const DRAWER_SIDEBAR_WIDTH = 340;
const DRAWER_SIDEBAR_PADDING = 24;

const SECONDARY_SIDEBAR_WIDTH_IA = 235;

const useLayoutStyles = makeStyles<
  { useExperienceNavigation?: boolean },
  'primaryLeftNavExpanded'
>()((theme, { useExperienceNavigation = false }, classes) => ({
  root: {
    height: '100%',
    position: 'relative',
  },
  primaryLeftNavCollapsedContainer: {
    position: 'absolute',
    zIndex: 1,
    borderRight: `1px solid ${theme.palette.components.input.outlined.enabledBorder}`,
  },
  primaryLeftNav: {
    height: '100%',
    backgroundColor: theme.palette.navigation.default,
    width: COLLAPSED_SIDEBAR_WIDTH,
    paddingLeft: COLLAPSED_PRIMARY_SIDEBAR_PADDING,
    paddingTop: 32,
    paddingBottom: 32,
    paddingRight: COLLAPSED_PRIMARY_SIDEBAR_PADDING,
    transition: 'width 200ms ease-out',
  },
  primaryLeftNavExpanded: {
    width: PRIMARY_SIDEBAR_WIDTH,
    paddingLeft: PRIMARY_SIDEBAR_PADDING,
    paddingRight: PRIMARY_SIDEBAR_PADDING,
  },
  leftNavExpanded: {
    padding: useExperienceNavigation ? 12 : '32px 12px 32px 24px',
    [theme.breakpoints.down('XLarge')]: {
      padding: useExperienceNavigation ? undefined : 24,
    },
  },
  secondaryLeftNavContainer: {
    paddingLeft: COLLAPSED_SIDEBAR_WIDTH,
    transition: 'opacity 200ms ease',
  },
  secondaryLeftNavOverlay: { opacity: 0.3 },
  secondaryLeftNav: {
    height: useExperienceNavigation ? '100%' : undefined,

    paddingTop: useExperienceNavigation ? undefined : 48,
    width: useExperienceNavigation ? SECONDARY_SIDEBAR_WIDTH_IA : SECONDARY_SIDEBAR_WIDTH,
  },
  primaryLeftNavContent: {
    // hold sidebar width when animating container width to avoid content shift
    minWidth: COLLAPSED_SIDEBAR_WIDTH - COLLAPSED_PRIMARY_SIDEBAR_PADDING * 2,
    [`.${classes.primaryLeftNavExpanded} &`]: {
      minWidth: PRIMARY_SIDEBAR_WIDTH - PRIMARY_SIDEBAR_PADDING * 2,
    },
  },
  parentLeftNavDrawer: {
    paddingTop: DRAWER_SIDEBAR_PADDING + topNavigationHeights.large,
    paddingLeft: DRAWER_SIDEBAR_PADDING,
    paddingRight: DRAWER_SIDEBAR_PADDING,
    paddingBottom: DRAWER_SIDEBAR_PADDING,
    width: DRAWER_SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: theme.palette.surface[0],
  },
  leftNavDrawer: {
    paddingTop: 20,
    paddingBottom: 8,
    width: '100%',
  },
  backButton: {
    paddingLeft: 0,
    marginBottom: 36,
    justifyContent: 'flex-start',
    color: theme.palette.actionV2.primary.fill,
    textTransform: 'none',
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },
}));

export default useLayoutStyles;
