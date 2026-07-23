import { makeStyles } from '@rbx/ui';
import { topNavigationHeight } from '../layout/layout/constants/layoutConstants';

const oneRowHeight = 40;
// NOTE (@tchu, 2025-08-08): You just have to try this out on many devices to see if this is the right number.
const rowsToCut = 4;
const minRows = 3;
const offset = 13; // NOTE: @neoxu (2025-08-22): Not the perfect number, but it works in majority of cases

const useSearchDialogStyles = makeStyles<{
  isSearchContentNothing?: boolean;
}>()((theme, { isSearchContentNothing = false }) => ({
  dialogPaper: {
    ...theme.border.radius.medium,
    width: '90vw',
    [theme.breakpoints.down(theme.breakpoints.values.Medium)]: {
      width: '100vw',
      ...theme.border.radius.none,
    },
    maxWidth: 800,
    position: 'absolute',
    margin: '0px auto',
    top: topNavigationHeight,
  },
  dialogContent: {
    padding: isSearchContentNothing ? '0px' : '0px 0px 4px 0px',
    '&:first-child': {
      paddingTop: 0,
    },
  },
  searchContainer: {
    backgroundColor: 'transparent',
    position: 'relative',
    [theme.breakpoints.down(theme.breakpoints.values.Small)]: {
      ...theme.border.radius.circle,
    },
  },
  searchInput: {
    backgroundColor: 'transparent',
    fontSize: 14,
    [theme.breakpoints.down(theme.breakpoints.values.Medium)]: {
      fontSize: 16, // NOTE: @neoxu (2025-08-25): To avoid when font-size < 16, iOS will zoom in
    },
    padding: 0,
  },
  searchInputOutline: {
    border: 'none',
  },
  searchInputOutlineRoot: {
    padding: '12px 16px',
  },
  searchDivider: {
    margin: '0 0 8px',
  },

  searchFilterChip: {
    marginLeft: 8,
  },
  bottomSearchList: {
    padding: '0px',
  },
  emptyResults: {
    padding: '8px 16px 16px 16px',
  },
  resultsContainer: {
    overflowX: 'hidden',
    maxHeight: `calc(100vh - ${oneRowHeight * rowsToCut + offset}px)`,
    // minHeight: `${oneRowHeight * minRows}px`,
    [theme.breakpoints.down(theme.breakpoints.values.Medium)]: {
      maxHeight: '100%',
      overflow: 'hidden',
    },
  },
}));

export default useSearchDialogStyles;
