import { makeStyles } from '@rbx/ui';
import {
  COMPACT_TRANSITION_DURATION,
  PRIMARY_RAIL_COLLAPSE_WIDTH,
  PRIMARY_RAIL_WIDTH,
} from '../../layout/constants';

const COMPACT_WIDTH = 48;
const ICON_WIDTH = 20;

const useRailStyles = makeStyles()((theme) => ({
  railContainer: {
    display: 'flex',
    position: 'relative',
    zIndex: 200,
    height: '100%',
    flexDirection: 'column',
    flexWrap: 'nowrap',
    padding: '0px 16px 16px 16px',
    gap: 8,
    backgroundColor: theme.palette.navigation.default,
    width: PRIMARY_RAIL_WIDTH,
    scrollbarWidth: 'none',
    transition: `width ${COMPACT_TRANSITION_DURATION}ms ease-out, padding ${COMPACT_TRANSITION_DURATION}ms ease-out, gap ${COMPACT_TRANSITION_DURATION}ms ease-out`,
  },

  railContainerTransition: {
    transition: `width ${COMPACT_TRANSITION_DURATION}ms ease-out, padding ${COMPACT_TRANSITION_DURATION}ms ease-out, gap ${COMPACT_TRANSITION_DURATION}ms ease-out`,
  },

  railContainerCompact: {
    width: PRIMARY_RAIL_COLLAPSE_WIDTH,
    padding: '0px 12px',
    gap: 0,
  },

  labelsRailContainer: {
    alignItems: 'center',
    transition: 'none',
  },

  headerContainer: {
    width: '100%',
    minHeight: '64px',
    paddingTop: '12px',
    display: 'flex',
    alignSelf: 'flex-start',
    alignItems: 'center',
  },

  header: {
    justifyContent: 'flex-start',
    textWrap: 'nowrap',
    transition: `opacity ${COMPACT_TRANSITION_DURATION}ms ease-out`,
    '&:hover': {
      backgroundColor: 'unset',
    },
  },

  headerCompact: {
    paddingLeft: `${(COMPACT_WIDTH - ICON_WIDTH) / 2}px`,
  },

  headerCollapseIcon: {
    height: 'fit-content',
  },

  railItemWrapper: {
    display: 'flex',
    width: '100%',
    margin: 0,
    padding: 0,
    borderRadius: 8,
  },

  railItemNoHover: {
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },

  railItem: {
    width: '100%',
    minWidth: 'unset',
    paddingLeft: 10,
    justifyContent: 'flex-start',
    alignItems: 'center',
    textWrap: 'nowrap',
    wordBreak: 'break-all',
  },

  railItemTransition: {
    transition: `width ${COMPACT_TRANSITION_DURATION}ms ease-out, padding ${COMPACT_TRANSITION_DURATION}ms ease-out, gap ${COMPACT_TRANSITION_DURATION}ms ease-out`,
  },

  railItemBottom: {
    marginTop: 'auto',
  },

  railItemVertical: {
    flexDirection: 'column',
    width: `${COMPACT_WIDTH}px`,
    justifyContent: 'center',
    alignItems: 'center',
    gap: '2px',
    paddingLeft: 0,
    paddingRight: 0,
    textAlign: 'center',
    textWrap: 'wrap',
    wordBreak: 'normal',
    height: 'fit-content',
    minHeight: 'unset',
    '&:hover': {
      background: 'transparent',
      textDecoration: 'none',
    },
  },

  startIcon: {
    marginLeft: 0,
    marginRight: 0,
  },

  startIconTransition: {
    transition: `padding ${COMPACT_TRANSITION_DURATION}ms ease-out, border-radius ${COMPACT_TRANSITION_DURATION}ms ease-out`,
  },

  startIconCompact: {
    padding: '4px',
    borderRadius: theme.shape.borderRadius,
  },

  label: {
    opacity: 1,
    paddingLeft: 20,
  },

  labelTransition: {
    transition: `opacity ${COMPACT_TRANSITION_DURATION}ms ease-out, width ${COMPACT_TRANSITION_DURATION}ms ease-out, padding ${COMPACT_TRANSITION_DURATION}ms ease-out`,
  },

  verticalLabel: {
    paddingLeft: 0,
  },

  headerLabel: {
    fontSize: 22,
    textTransform: 'uppercase',
  },
}));

export default useRailStyles;
