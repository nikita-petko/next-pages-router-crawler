import { makeStyles } from '@rbx/ui';

const useManualFeedbackStyles = makeStyles()((theme) => ({
  accordion: {
    backgroundColor: theme.palette.background.default,
  },

  container: {
    marginTop: 15,
    marginBottom: 15,
  },

  text: {
    maginTop: 5,
    marginBottom: 5,
  },

  errorText: {
    marginLeft: 10,
  },
}));

export default useManualFeedbackStyles;
