import { makeStyles } from '@rbx/ui';

const useToolsStyles = makeStyles()((theme) => ({
  root: {
    width: '100%',
    position: 'relative',
    padding: '0 10px',
    maxWidth: 1250,
    margin: 'auto',
  },

  description: {
    [theme.breakpoints.up('XXLarge')]: {
      fontSize: 22,
    },
  },

  descriptionContainer: {
    maxWidth: 850,
    margin: '20px auto',
  },

  toolsGrid: {
    margin: '20px 0',
    '& svg': {
      color: theme.palette.actionV2.primaryBrand.fill,
    },
  },

  manageContentContainer: {
    paddingTop: 8,
    [theme.breakpoints.down('XLarge')]: {
      display: 'none',
      padding: '0',
    },
  },
}));

export default useToolsStyles;
