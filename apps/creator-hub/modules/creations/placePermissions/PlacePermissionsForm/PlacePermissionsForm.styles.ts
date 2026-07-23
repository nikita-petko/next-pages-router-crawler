import { makeStyles } from '@rbx/ui';

const usePlacePermissionsFormStyles = makeStyles()((theme) => ({
  formContainer: {
    width: '100%',
    '& > *:not(:last-child)': {
      paddingBottom: 48,
    },
    [theme.breakpoints.down('Large')]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },

  inputFormPadding: {
    width: '100%',
    '& > *:not(:last-child)': {
      paddingBottom: 24,
    },
  },

  checkboxPadding: {
    paddingLeft: 8,
  },

  divider: {
    marginBottom: 32,
  },

  button: {
    marginRight: 12,
    [theme.breakpoints.down('Large')]: {
      marginRight: 0,
      marginBottom: 12,
    },
  },

  error: {
    padding: '4px 12px',
  },

  radioGroup: {
    paddingLeft: 12,
    maxWidth: 'fit-content',
  },

  textFieldPadding: {
    paddingTop: 8,
  },
  // Alert component doesn't center text correctly if just a title is
  // provided
  warningAlertStyles: {
    display: 'flex',
    alignItems: 'center',
  },
}));

export default usePlacePermissionsFormStyles;
