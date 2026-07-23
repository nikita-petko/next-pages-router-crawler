import { makeStyles } from '@rbx/ui';

const useFailureViewStyles = makeStyles()(() => ({
  failurePageContainer: {
    width: '100%',
    height: '100%',
  },

  textContainer: {
    marginBottom: 24,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },

  titleText: {
    fontWeight: 'bold',
  },
}));

export default useFailureViewStyles;
