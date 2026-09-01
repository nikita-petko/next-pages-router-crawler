import { makeStyles } from '@rbx/ui';
import {
  EXPLORE_LICENSES_ACTION_GAP_PX,
  EXPLORE_LICENSES_ACTION_TOOLBAR_HEIGHT_PX,
} from '../utils/constants';

const useListingsGridStyles = makeStyles()((theme) => ({
  sortToolbarRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    flexWrap: 'nowrap',
    gap: theme.spacing(1),
    marginBottom: EXPLORE_LICENSES_ACTION_GAP_PX,
    boxSizing: 'border-box',
    height: EXPLORE_LICENSES_ACTION_TOOLBAR_HEIGHT_PX,
    minHeight: EXPLORE_LICENSES_ACTION_TOOLBAR_HEIGHT_PX,
  },
  sortToolbarLeadingFlex: {
    flex: 1,
    minWidth: 0,
  },
  sortToolbarSortWrap: {
    minWidth: 0,
    flex: '1 1 auto',
  },
  sortToolbarEnd: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  itemGrid: {
    marginTop: 0,
    display: 'grid',
    width: '100%',
    boxSizing: 'border-box',
    gridGap: EXPLORE_LICENSES_ACTION_GAP_PX,
    gridTemplateColumns: `repeat(auto-fit, minmax(240px, 1fr))`,
    justifyContent: 'stretch',
    [theme.breakpoints.down('Medium')]: {
      gridGap: theme.spacing(1),
      gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 272px), 1fr))`,
    },
  },
}));

export default useListingsGridStyles;
