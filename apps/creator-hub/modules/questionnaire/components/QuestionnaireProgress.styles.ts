import { makeStyles } from '@rbx/ui';

const fullWidthHeight = {
  width: '100%',
  height: '100%',
};

const useQuestionnaireProgressStyles = makeStyles()((theme) => ({
  title: {
    marginBottom: theme.spacing(1),
  },

  message: {
    marginBottom: theme.spacing(1),
  },

  button: {
    marginBottom: theme.spacing(0),
  },

  mainGridMargin: {
    ...fullWidthHeight,
    marginTop: theme.spacing(5),
    display: 'flex',
    flexDirection: 'column',
  },

  boldText: {
    fontWeight: 'bold',
  },
}));

export default useQuestionnaireProgressStyles;
