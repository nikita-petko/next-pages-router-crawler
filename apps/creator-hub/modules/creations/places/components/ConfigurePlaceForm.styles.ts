import { makeStyles } from '@rbx/ui';

const useConfigurePlaceFormStyles = makeStyles()((theme) => ({
  placeSubheader: {
    marginTop: 16,
  },

  buttonStyle: {
    margin: '0 12px',
    [theme.breakpoints.down('Large')]: {
      margin: '12px 0',
    },
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

  errorMessageStyle: {
    marginLeft: 14,
    marginTop: 4,
    fontWeight: 'bold',
    fontSize: 12,
  },

  buttonContainerStyle: {
    marginTop: 32,
  },
}));

export default useConfigurePlaceFormStyles;
