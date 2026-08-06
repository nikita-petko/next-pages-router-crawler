import { makeStyles } from '@rbx/ui';
import {
  COMPACT_TRANSITION_DURATION,
  PRIMARY_RAIL_COLLAPSE_WIDTH,
  PRIMARY_RAIL_WIDTH,
  RAIL_HORIZONTAL_PADDING,
} from '../../layout/constants';

const COMPACT_WIDTH = 40;
const ICON_ONLY_ITEM_SIZE = 40;
const ICON_WIDTH = 20;
const LABEL_MAX_WIDTH = 200;

const useRailStyles = makeStyles()((theme) => ({
  railContainer: {
    display: 'flex',
    position: 'relative',
    zIndex: 200,
    height: '100%',
    flexDirection: 'column',
    flexWrap: 'nowrap',
    padding: `0px ${RAIL_HORIZONTAL_PADDING}px ${RAIL_HORIZONTAL_PADDING}px ${RAIL_HORIZONTAL_PADDING}px`,
    gap: 8,
    backgroundColor: theme.palette.navigation.default,
    width: PRIMARY_RAIL_WIDTH,
    scrollbarWidth: 'none',
    overscrollBehavior: 'none',
  },

  railContainerTransition: {
    transition: `width ${COMPACT_TRANSITION_DURATION}ms ease-out, padding ${COMPACT_TRANSITION_DURATION}ms ease-out, gap ${COMPACT_TRANSITION_DURATION}ms ease-out`,
  },

  railContainerCompact: {
    width: PRIMARY_RAIL_COLLAPSE_WIDTH,
    padding: `0px ${RAIL_HORIZONTAL_PADDING}px`,
    gap: 0,
  },

  railContainerIconOnly: {
    width: PRIMARY_RAIL_COLLAPSE_WIDTH,
    padding: `0px ${RAIL_HORIZONTAL_PADDING}px ${RAIL_HORIZONTAL_PADDING}px ${RAIL_HORIZONTAL_PADDING}px`,
    gap: 8,
  },

  labelsRailContainer: {
    alignItems: 'center',
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
    paddingLeft: (COMPACT_WIDTH - ICON_WIDTH) / 2,
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
    minHeight: 40,
    margin: 0,
    padding: 0,
    alignItems: 'center',
    ...theme.border.radius.medium,
  },

  railItemNoHover: {
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },

  railItem: {
    width: '100%',
    minWidth: 'unset',
    minHeight: 40,
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
    ...theme.border.radius.medium,
  },

  railItemIconOnly: {
    width: ICON_ONLY_ITEM_SIZE,
    height: ICON_ONLY_ITEM_SIZE,
    minWidth: ICON_ONLY_ITEM_SIZE,
    minHeight: ICON_ONLY_ITEM_SIZE,
    padding: 0,
    paddingLeft: (ICON_ONLY_ITEM_SIZE - ICON_WIDTH) / 2,
    justifyContent: 'flex-start',
    alignItems: 'center',
    ...theme.border.radius.medium,
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },

  label: {
    opacity: 1,
    paddingLeft: 20,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    maxWidth: LABEL_MAX_WIDTH,
    [theme.breakpoints.up('Large')]: {
      fontSize: 14,
    },
  },

  labelTransition: {
    transition: `opacity ${COMPACT_TRANSITION_DURATION}ms ease-out`,
  },

  verticalLabel: {
    paddingLeft: 0,
    [theme.breakpoints.up('Large')]: {
      fontSize: theme.typography.captionSmall.fontSize,
    },
  },

  labelHidden: {
    opacity: 0,
    maxWidth: 0,
    paddingLeft: 0,
    transition: `opacity ${COMPACT_TRANSITION_DURATION}ms ease-out, max-width 0ms ${COMPACT_TRANSITION_DURATION}ms, padding-left 0ms ${COMPACT_TRANSITION_DURATION}ms`,
  },

  headerLabel: {
    fontSize: 22,
    textTransform: 'uppercase',
  },
}));

export default useRailStyles;
