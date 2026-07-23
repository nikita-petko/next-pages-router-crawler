import { makeStyles } from '@rbx/ui';

const useStoreTransactionsTableStyles = makeStyles()(() => ({
  noResultsContainer: {
    padding: '70px 0px',
  },

  tableHeaderCell: {
    textAlign: 'left',
  },
}));

export default useStoreTransactionsTableStyles;
