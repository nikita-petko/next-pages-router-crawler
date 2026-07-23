import { makeStyles } from '@rbx/ui';

const useErrorLogTableStyles = makeStyles()((theme) => ({
  loadingContainer: {
    height: 300,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tableContainer: {
    backgroundColor: theme.palette.surface[300],
  },

  paginationContainer: {
    borderBottom: 0,
  },
}));

export default useErrorLogTableStyles;
