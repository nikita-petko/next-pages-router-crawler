import { makeStyles } from '@rbx/ui';

const useSelectablePlacesTableV2Styles = makeStyles()(() => ({
  searchRestartContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  searchField: {
    marginTop: 16,
    marginBottom: 16,
    width: 440,
  },
  searchIcon: {
    paddingLeft: 12,
    display: 'flex',
    alignItems: 'center',
  },
  table: {
    minWidth: 900,
    width: '100%',
    '& tbody tr:last-child td': {
      borderBottom: 'none !important',
    },
  },
  tableContainer: {
    width: '100%',
    overflowX: 'auto',
  },
  placesColumn: {
    minWidth: 150,
    overflow: 'hidden',
    padding: 12,
  },
  publishedOnColumn: {
    gap: 16,
  },
  activeServersColumn: {
    minWidth: 150,
  },
  outdatedServersColumn: {
    minWidth: 150,
  },
  viewDetailsColumn: {
    minWidth: 52,
    maxWidth: 52,
  },
  placeRow: {
    cursor: 'pointer',
  },
  placesHeader: {
    display: 'flex',
    alignItems: 'center',
  },
  placeRowWithCheckbox: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    minWidth: 0,
  },
  placeCheckbox: {
    marginRight: 12,
  },
  placeAvatar: {
    width: 32,
    height: 32,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& img': {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: 4,
    },
  },
  placeListItem: {
    padding: 0,
  },
  emptyStateCell: {
    textAlign: 'center',
    padding: 24,
  },
  publishedOnText: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    display: 'block',
  },
  paginationToolbar: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
}));

export default useSelectablePlacesTableV2Styles;
