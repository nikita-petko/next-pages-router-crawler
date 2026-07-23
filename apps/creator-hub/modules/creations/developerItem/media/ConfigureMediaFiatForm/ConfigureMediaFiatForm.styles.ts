import { makeStyles } from '@rbx/ui';

const useConfigureMediaFiatFormStyles = makeStyles()((theme) => ({
  accessCardStyle: {
    margin: '12px 24px',
    marginRight: 0,
  },

  button: {
    marginRight: 12,
  },

  buttonContainer: {
    padding: '32px 0',
  },

  divider: {
    marginBottom: 48,
    marginTop: 48,
  },

  errorMessageContainer: {
    color: theme.palette.actionV2.important.fill,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    paddingLeft: 14,
    paddingRight: 14,
    width: '100%',
    whiteSpace: 'break-spaces',
  },

  helperTextStyle: {
    paddingLeft: 36,
  },

  pageContainer: {
    gridGap: 40,
    [theme.breakpoints.down('Large')]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },

  radioLabel: {
    paddingRight: 4,
  },

  radioStyle: {
    paddingLeft: 9,
  },

  subtitleContainer: {
    paddingBottom: 12,
  },
}));

export default useConfigureMediaFiatFormStyles;
