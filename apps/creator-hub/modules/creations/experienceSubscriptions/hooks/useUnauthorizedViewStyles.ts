import { makeStyles } from '@rbx/ui';

const useUnauthorizedViewStyles = makeStyles()(() => ({
  failurePageContainer: {
    width: '100%',
    height: '100%',
  },

  textContainer: {
    marginTop: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
}));

export default useUnauthorizedViewStyles;
