import { makeStyles } from '@rbx/ui';

const useCashOutFormStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
    width: '100%',
    maxWidth: theme.breakpoints.values.Medium,
    margin: 'auto',
  },
}));

export default useCashOutFormStyles;
