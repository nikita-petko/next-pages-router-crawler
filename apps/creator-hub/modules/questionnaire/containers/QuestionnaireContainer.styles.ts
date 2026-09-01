import { makeStyles } from '@rbx/ui';

const fullWidthHeight = {
  width: '100%',
  height: '100%',
};

const useQuestionnaireStyles = makeStyles()((theme) => ({
  sectionStyle: {
    ...fullWidthHeight,
    maxWidth: '700px',
  },

  sectionQuestion: {
    marginTop: theme.spacing(1),
  },

  sectionSubQuestion: {
    marginTop: `20px`,
  },

  container: {
    ...fullWidthHeight,
  },

  navigationButtonsContainer: {
    display: 'flex',
    flexFlow: 'row wrap',
    marginTop: theme.spacing(1),
  },

  navigationButtons: {
    marginRight: `16px`,
    marginTop: theme.spacing(1),
  },

  warningTextContainer: {
    margin: `${theme.spacing(4)} 0`,
    fontStyle: 'italic',
  },
}));

export default useQuestionnaireStyles;
