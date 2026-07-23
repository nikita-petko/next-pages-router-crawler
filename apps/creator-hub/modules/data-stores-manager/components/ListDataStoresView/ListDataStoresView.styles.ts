import { makeStyles } from '@rbx/ui';

const useListDataStoresViewStyles = makeStyles()(() => {
  return {
    dsCard: {
      padding: -100,
      marginTop: 4,
      height: '100%',
      width: '100%',
    },
    listManagerContainer: {
      paddingBottom: 16,
    },
    loadingProgress: {
      paddingTop: 96,
      height: '50%',
    },
    dataStoresListRow: {
      whiteSpace: 'pre-line',
    },
    dataStoresListRowDeleted: {
      whiteSpace: 'pre-line',
      filter: 'grayscale(100%)',
    },
    dataStoresListCell: {
      opacity: 1.0,
    },
    dataStoresListCellDeleted: {
      opacity: 0.3,
    },
    searchInputAdornment: {
      paddingLeft: 8,
    },
    cancelInputAdornment: {
      paddingRight: 8,
    },
    tableCellContainer: {
      fontWeight: 400,
      width: '15%',
    },
    dataStoreNameCell: {
      fontWeight: 400,
      width: '50%',
    },
    actionMenuCell: {
      paddingRight: 20,
    },
    listDataStoresTable: {
      margin: -8,
      tableLayout: 'fixed',
    },
    listIcon: {
      marginRight: -10,
    },
  };
});
export default useListDataStoresViewStyles;
