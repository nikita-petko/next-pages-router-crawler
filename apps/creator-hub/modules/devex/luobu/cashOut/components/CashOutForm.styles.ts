import { makeStyles } from '@rbx/ui';

const useCashOutFormStyles = makeStyles()((theme) => ({
  root: {
    width: '100%',
    maxWidth: '688px',
    padding: theme.spacing(1),
    margin: 'auto',
  },

  header: {
    marginBottom: theme.spacing(1),
  },
}));

export default useCashOutFormStyles;
