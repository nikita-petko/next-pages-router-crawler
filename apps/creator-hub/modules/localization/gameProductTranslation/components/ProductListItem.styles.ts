import { makeStyles } from '@rbx/ui';

const useProductListItemStyles = makeStyles()((theme) => ({
  buttonListItem: {
    paddingLeft: theme.spacing(4),
  },

  buttonListSubItem: {
    paddingLeft: theme.spacing(6),
  },

  displayNone: {
    display: 'none',
  },
}));

export default useProductListItemStyles;
