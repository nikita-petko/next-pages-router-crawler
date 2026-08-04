import { makeStyles } from '@rbx/ui';

const useVersionHistoryStyles = makeStyles()(() => ({
  container: {
    padding: 8,
  },

  title: {
    marginBottom: 12,
  },

  description: {
    marginBottom: 64,
  },

  tableContainer: {
    overflowX: 'scroll',
  },

  icon: {
    marginRight: 7,
    height: 19,
  },
}));

export default useVersionHistoryStyles;
