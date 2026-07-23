import { makeStyles } from '@rbx/ui';

const useVerifyEmailComponentStyles = makeStyles()(() => ({
  mainContainer: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    margin: '15% 10%',
  },

  textInput: {
    marginTop: 48,
    width: '40%',
  },

  title: {
    marginBottom: 12,
  },

  verifyButton: {
    marginTop: 36,
  },
}));
export default useVerifyEmailComponentStyles;
