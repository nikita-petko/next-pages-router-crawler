import { makeStyles } from '@rbx/ui';

const useCreateBadgeFormStyles = makeStyles()((theme) => ({
  createBadgeInfoText: {
    marginTop: 16,
  },

  createButton: {
    marginLeft: 12,
    marginRight: 12,
  },

  priceIcon: {
    verticalAlign: 'sub',
    fontSize: '1rem',
  },

  pageContainer: {
    width: '100%',
    height: '100%',
    minHeight: 450,
  },

  formContainer: {
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

  errorMessageStyles: {
    width: '100%',
    marginTop: 4,
    paddingLeft: 14,
    paddingRight: 14,
    color: theme.palette.actionV2.important.fill,
    fontWeight: 'bold',
    fontSize: 12,
  },

  rtlInputStyle: {
    direction: 'rtl',
  },
}));

export default useCreateBadgeFormStyles;
