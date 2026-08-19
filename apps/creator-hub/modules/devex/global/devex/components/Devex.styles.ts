import { makeStyles } from '@rbx/ui';

const useDevexStyles = makeStyles()(() => ({
  root: {
    width: '100%',
    flexDirection: 'column',
  },

  cashOutBoxContainer: {
    marginTop: 24,
    marginBottom: 24,
  },

  marginBottom: {
    marginBottom: 16,
  },

  bulletListIcon: {
    minWidth: 0,
    marginRight: 8,
  },

  bulletListItem: {
    paddingLeft: 0,
  },
}));

export default useDevexStyles;
