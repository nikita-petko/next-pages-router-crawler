import { makeStyles } from '@rbx/ui';

const useCreationsToolbarStyles = makeStyles()((theme) => ({
  toolbarContainer: {
    [theme.breakpoints.down('Large')]: {
      flexGrow: 1,
      justifyContent: 'space-between',
    },
    paddingLeft: 12,
  },

  sortContainer: {
    marginTop: -12,
    [theme.breakpoints.down('Large')]: {
      marginTop: 0,
    },
  },

  labelText: {
    marginRight: 26,
    whiteSpace: 'nowrap',
  },

  timedOptionsButton: {
    marginLeft: 12,
    marginRight: 12,
  },

  timedOptionsButtonDivider: {
    marginLeft: 12,
    marginRight: 12,
  },
}));

export default useCreationsToolbarStyles;
