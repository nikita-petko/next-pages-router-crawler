import { makeStyles } from '@rbx/ui';

const useItemGridEmptyViewStyles = makeStyles()(() => ({
  emptyStateGridContainer: {
    minHeight: 200,
  },

  emptyStateTextContainer: {
    textAlign: 'center',
    width: '100%',
    marginTop: 72,
  },

  emptyStateText: {
    marginBottom: 64,
  },

  emptyStateCreateItemButtonContainer: {
    width: '100%',
  },
}));

export default useItemGridEmptyViewStyles;
