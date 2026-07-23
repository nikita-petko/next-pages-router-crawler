import { makeStyles } from '@rbx/ui';

const useConfigureEnvironmentFormStyles = makeStyles()((theme) => ({
  buttonStyle: {
    marginLeft: 12,
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
    [theme.breakpoints.up('Large')]: {
      maxWidth: 768,
    },
  },
  inputFormPadding: {
    width: '100%',
    '& > *:not(:last-child)': {
      paddingBottom: 0,
    },
  },
}));

export default useConfigureEnvironmentFormStyles;
