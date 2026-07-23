import { makeStyles } from '@rbx/ui';

const useNotificationContentFormStyles = makeStyles()((theme) => ({
  createButton: {
    marginLeft: 12,
    marginRight: 12,
  },

  createNotificationInfoText: {
    marginTop: 16,
    marginBottom: 48,
    '& > *:not(:last-child)': {
      paddingBottom: 10,
    },
  },

  dividerMargin: {
    marginTop: 24,
  },

  formWrapper: {
    width: '100%',
  },

  formInputPadding: {
    paddingBottom: 32,
  },

  containerPadding: {
    width: '100%',
    [theme.breakpoints.down('Medium')]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },

  errorMessageStyles: {
    width: '100%',
    marginTop: 4,
    paddingLeft: 14,
    paddingRight: 14,
    fontWeight: 'bold',
    fontSize: 12,
  },

  menuItemLink: {
    width: '100%',
    padding: '0 16px',
  },

  cancelLink: {
    [theme.breakpoints.down('Medium')]: {
      width: 'inherit',
      padding: '0 12px',
      marginBottom: 12,
    },
  },

  cancelButton: {
    [theme.breakpoints.down('Medium')]: {
      width: 'inherit',
    },
  },
}));

export default useNotificationContentFormStyles;
