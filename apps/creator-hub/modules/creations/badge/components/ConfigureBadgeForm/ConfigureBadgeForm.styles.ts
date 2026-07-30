import { makeStyles } from '@rbx/ui';

const useBadgeConfigureFormStyles = makeStyles()((theme) => ({
  typographyStyle: {
    marginTop: 16,
  },

  buttonStyle: {
    marginLeft: 12,
  },

  errorMessageStyle: {
    marginLeft: 14,
    marginTop: 4,
    fontWeight: 'bold',
    fontSize: 12,
  },

  formPadding: {
    width: '100%',
    '& > *:not(:last-child)': {
      paddingBottom: 48,
    },
    [theme.breakpoints.down('Medium')]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },

  inputFormPadding: {
    width: '100%',
    '& > *:not(:last-child)': {
      paddingBottom: 32,
    },
  },

  switchPadding: {
    paddingLeft: 12,
  },

  rtlInputStyle: {
    direction: 'rtl',
  },
}));

export default useBadgeConfigureFormStyles;
