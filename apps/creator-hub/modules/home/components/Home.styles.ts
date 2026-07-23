import { makeStyles } from '@rbx/ui';

const UPDATES_COLUMN_WIDTH = 330;
const UPDATES_COLLAPSED_PADDING_LEFT = 6;
const UPDATES_COLLAPSED_COLUMN_WIDTH = 36 + UPDATES_COLLAPSED_PADDING_LEFT;

const useHomeLayoutStyles = makeStyles()((theme) => ({
  homeLayout: {
    display: 'grid',
    gridTemplateColumns: `minmax(0, 1fr) ${UPDATES_COLUMN_WIDTH}px`,
    columnGap: 24,
    alignItems: 'start',
    justifyItems: 'stretch',
    width: '100%',
    position: 'relative',
    boxSizing: 'border-box',
    [theme.breakpoints.down('Large')]: {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  },
  homeLayoutCollapsed: {
    gridTemplateColumns: `minmax(0, 1fr) ${UPDATES_COLLAPSED_COLUMN_WIDTH}px`,
    columnGap: 0,
  },
  mainColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    alignSelf: 'flex-start',
    flex: '1 1 0',
  },
  knowledgeFeedWrapper: {
    maxWidth: '100%',
    overflow: 'visible',
    boxSizing: 'border-box',
  },
  updatesContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 16,
    flex: `0 0 ${UPDATES_COLUMN_WIDTH}px`,
    width: UPDATES_COLUMN_WIDTH,
    minWidth: UPDATES_COLUMN_WIDTH,
    maxWidth: UPDATES_COLUMN_WIDTH,
    flexShrink: 0,
    alignSelf: 'flex-start',
    position: 'sticky',
    top: 0,
    gridColumn: '2 / 3',
    background: theme.palette.surface[0],
    zIndex: 1,
    [theme.breakpoints.down('Large')]: {
      position: 'static',
      top: 'auto',
      width: '100%',
      maxWidth: '100%',
      flex: '1 1 0',
      gridColumn: '1 / 2',
      zIndex: 'auto',
    },
  },
  updatesContainerCollapsed: {
    flex: `0 0 ${UPDATES_COLLAPSED_COLUMN_WIDTH}px`,
    width: UPDATES_COLLAPSED_COLUMN_WIDTH,
    minWidth: UPDATES_COLLAPSED_COLUMN_WIDTH,
    maxWidth: UPDATES_COLLAPSED_COLUMN_WIDTH,
    paddingLeft: UPDATES_COLLAPSED_PADDING_LEFT,
    alignItems: 'flex-end',
    gap: 0,
    boxSizing: 'border-box',
  },
}));

export default useHomeLayoutStyles;
