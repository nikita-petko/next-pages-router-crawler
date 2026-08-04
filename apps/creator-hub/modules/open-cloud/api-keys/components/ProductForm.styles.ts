import { makeStyles } from '@rbx/ui';

const useProductFormStyles = makeStyles()((theme) => ({
  divider: {
    marginTop: 8,
    marginBottom: 8,
  },

  addFirstTargetPartBtn: {
    marginLeft: 8,
    [theme.breakpoints.down('Medium')]: {
      marginTop: 8,
      marginLeft: 0,
    },
  },

  firstScopeTargetSubLevel: {
    marginLeft: 8,
  },

  searchDropdown: {
    minWidth: '50%',
    [theme.breakpoints.down('Medium')]: {
      minWidth: '100%',
    },
  },
}));

export default useProductFormStyles;
