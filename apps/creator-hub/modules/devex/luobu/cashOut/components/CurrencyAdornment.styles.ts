import { makeStyles } from '@rbx/ui';

const useCurrencyAdornmentStyles = makeStyles()((theme) => ({
  inputAdornment: {
    paddingLeft: theme.spacing(1),
    height: '100%',
    margin: 0,
  },

  currency: {
    height: '20px',
  },
}));

export default useCurrencyAdornmentStyles;
