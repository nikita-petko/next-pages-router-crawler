import { makeStyles } from '@rbx/ui';

const useEditSecretStyles = makeStyles()(() => ({
  errorPadding: {
    width: '100%',
    paddingBottom: 16,
  },

  inputFormPadding: {
    width: '100%',
    '& > *:not(:last-child)': {
      paddingBottom: 24,
    },
  },
}));

export default useEditSecretStyles;
