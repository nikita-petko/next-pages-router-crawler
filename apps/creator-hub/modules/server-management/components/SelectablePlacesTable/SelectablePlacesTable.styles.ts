import { makeStyles } from '@rbx/ui';

const useSelectablePlacesTableStyles = makeStyles()(() => ({
  card: {
    padding: 24,
    marginTop: 16,
  },
  searchField: {
    marginTop: 16,
    marginBottom: 16,
    width: 440,
  },
  avatarCell: {
    alignItems: 'center',
    width: 240,
    paddingLeft: 2,
    paddingRight: 0,
  },
  paginationContainer: {
    marginTop: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowsPerPage: {
    marginRight: 16,
    minWidth: 80,
  },
  pageInfo: {
    margin: '0 16px',
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  buttonContainer: {
    marginTop: 32,
    display: 'flex',
    justifyContent: 'flex-start',
  },
  searchIcon: {
    paddingRight: 8,
    display: 'flex',
    alignItems: 'center',
  },
  table: {
    minWidth: 900,
    width: '100%',
  },
  placesColumn: {
    minWidth: 240,
    maxWidth: 240,
    overflow: 'hidden',
  },
  publishedVersionColumn: {
    minWidth: 80,
  },
  publishedOnColumn: {
    minWidth: 170,
  },
  serversColumn: {
    minWidth: 80,
  },
  outdatedServersColumn: {
    minWidth: 110,
  },
  playersColumn: {
    minWidth: 80,
  },
  playersOnOutdatedColumn: {
    minWidth: 150,
  },
  placeName: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
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
  placesHeader: {
    display: 'flex',
    alignItems: 'center',
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
  tableContainer: {
    maxHeight: 420,
    overflowY: 'auto',
    width: '100%',
    overflowX: 'auto',
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
}));

export default useSelectablePlacesTableStyles;
