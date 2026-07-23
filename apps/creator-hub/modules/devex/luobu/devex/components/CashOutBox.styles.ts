import { makeStyles } from '@rbx/ui';

const useCashOutBoxStyles = makeStyles()((theme) => ({
  root: {
    padding: theme.spacing(2),
    margin: 'auto',
    width: '100%',
    background: theme.palette.background.media,
  },

  amount: {
    marginBottom: theme.spacing(2 / 3),
  },
}));

export default useCashOutBoxStyles;
