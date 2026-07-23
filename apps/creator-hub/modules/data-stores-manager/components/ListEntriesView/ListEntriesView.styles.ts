import { makeStyles } from '@rbx/ui';

const useListEntriesViewStyles = makeStyles()(() => {
  return {
    toggleLabel: {
      marginBottom: 1,
      paddingRight: 12,
    },
    entryCard: {
      height: '100%',
      width: '100%',
    },
    dataStoreTitle: {
      marginTop: 16,
    },
    ListEntriesViewCell: {
      whiteSpace: 'pre-line',
      filter: 'grayscale(100%)',
      opacity: 1,
    },
    ListEntriesViewCellDeleted: {
      whiteSpace: 'pre-line',
      filter: 'grayscale(100%)',
      opacity: 0.3,
    },
    statusLabel: {
      fontSize: 10,
    },
    status: {
      marginRight: 8,
      paddingTop: 8,
      paddingBottom: 32,
    },
    revertButton: {
      fontSize: '0.7rem',
      maxHeight: '16px',
      maxWidth: '50%',
    },
    compareButton: {
      fontSize: '0.7rem',
      maxHeight: '16px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '100%',
    },
    versionSelect: {
      '& .MuiSelect-select': {
        fontSize: '0.75rem',
        paddingTop: 8,
        paddingBottom: 8,
        display: 'flex',
        alignItems: 'center',
      },
      '& .MuiOutlinedInput-root': {
        fontSize: '0.75rem',
        minHeight: 35,
        maxHeight: 35,
      },
      '& .MuiSelect-listbox': {
        scrollbarWidth: 'thin',
      },
    },
    versionIdText: {
      textAlign: 'right',
    },
    versionList: {
      fontSize: '0.75rem',
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 4,
      paddingRight: 2,
    },
    searchInputAdornment: {
      paddingLeft: 8,
    },
    cancelInputAdornment: {
      paddingRight: 8,
    },
    leftContainer: {
      paddingRight: 16,
      '@media (min-width: 800px)': {
        flex: '0 0 50%',
        maxWidth: '50%',
        minWidth: 0,
      },
    },
    rightContainer: {
      '@media (min-width: 800px)': {
        flex: '0 0 50%',
        maxWidth: '50%',
        minWidth: 0,
      },
    },
    listEntriesTable: {
      margin: -8,
      tableLayout: 'fixed',
    },
    tableCellContainer: {
      fontWeight: 400,
    },
    actionMenuCell: {
      paddingRight: 20,
    },
    objectKeyText: {
      fontSize: 14,
    },
    statusText: {
      marginRight: 8,
    },
    listIcon: {
      marginRight: -10,
    },
    backToDataStoresText: {
      paddingTop: 64,
    },
  };
});

export default useListEntriesViewStyles;
