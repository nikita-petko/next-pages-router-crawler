import { makeStyles } from '@rbx/ui';

const useFooterStyles = makeStyles()((theme) => ({
  column: {
    padding: '16px 24px',
  },

  footer: {
    backgroundColor: theme.palette.navigation.default,
    width: '100%',
    padding: '32px 0',
    [theme.breakpoints.down('XXLarge')]: {
      padding: '24px 0',
    },
    [theme.breakpoints.down('XLarge')]: {
      padding: '24px 40px',
    },
  },
}));

export default useFooterStyles;
