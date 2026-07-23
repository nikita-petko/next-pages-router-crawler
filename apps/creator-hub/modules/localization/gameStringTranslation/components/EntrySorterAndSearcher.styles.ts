import { makeStyles } from '@rbx/ui';

const useEntrySorterAndSearcherStyles = makeStyles()((theme) => ({
  sortAndSearch: {
    paddingRight: theme.spacing(1),
  },

  searchBar: {
    marginTop: theme.spacing(1 / 4),
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },

  menu: {
    width: '100%',
    paddingLeft: theme.spacing(4),
  },

  heading: {
    marginBottom: 4,
  },

  tooltipIconPadding: {
    verticalAlign: 'bottom',
    display: 'inline-block',
    [theme.breakpoints.down('XXLarge')]: {
      marginLeft: 10,
    },
  },

  search: {
    marginLeft: -10,
  },

  searchAdornment: {
    marginRight: 10,
  },

  tooltipLabel: {
    position: 'relative',
    marginRight: 12,
    zIndex: 2,
    [theme.breakpoints.down('XXLarge')]: {
      marginRight: 5,
      marginLeft: -38,
    },
  },

  loader: {
    marginRight: -28,
    zIndex: 1,
    [theme.breakpoints.down('XXLarge')]: {
      marginRight: 10,
      marginLeft: -38,
    },
  },
}));

export default useEntrySorterAndSearcherStyles;
