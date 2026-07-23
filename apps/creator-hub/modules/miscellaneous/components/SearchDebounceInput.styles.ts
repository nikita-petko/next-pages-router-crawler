import { makeStyles } from '@rbx/ui';

const useSearchDebounceInputStyles = makeStyles<{ width?: number }>()((theme, { width }) => ({
  root: {
    width: '100%',
    height: '100%',
  },

  searchErrorMsgContainer: {
    position: 'relative',
  },

  searchErrorMsgTxt: {
    position: 'absolute',
    top: '0px',
    left: '0px',
    paddingTop: theme.spacing(0.25),
  },

  searchResultList: {
    width: '492px',
    '& ul': {
      paddingTop: theme.spacing(0),
      paddingBottom: theme.spacing(0),
    },
  },

  menuList: width ? { width } : {},

  searchResultItem: {
    lineHeight: '2.5em',
    textOverflow: 'ellipsis',
  },

  searchItemsContainer: {
    maxHeight: '260px',
    overflowY: 'auto',
  },

  divider: {
    borderBottom: `1px solid ${theme.palette.surface.outline}`,
  },
}));

export default useSearchDebounceInputStyles;
