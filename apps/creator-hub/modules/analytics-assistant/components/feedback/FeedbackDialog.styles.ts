import { makeStyles } from '@rbx/ui';

const useFeedbackStyles = makeStyles()((theme) => ({
  container: {
    width: '750px',
    margin: '0 auto',
    padding: '12px',
  },
  question: {
    marginBottom: '4px',
  },
  textarea: {
    margin: theme.spacing(1, 0),
  },
  actions: {
    justifyContent: 'flex-end',
    paddingTop: '10px',
  },
}));

export default useFeedbackStyles;
