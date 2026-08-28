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

  heading: {
    marginBottom: 4,
  },

  searchAdornment: {
    marginRight: 10,
  },
}));

export default useEntrySorterAndSearcherStyles;
