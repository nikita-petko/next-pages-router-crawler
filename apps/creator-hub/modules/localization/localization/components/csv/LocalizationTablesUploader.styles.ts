import { makeStyles } from '@rbx/ui';

const LocalizationTableUploaderStyles = makeStyles()(() => ({
  divider: {
    marginTop: 25,
    marginBottom: 20,
  },

  container: {
    marginTop: 10,
    marginBottom: 10,
  },

  progressBar: {
    paddingLeft: 25,
    marginTop: 15,
  },

  descriptionText: {
    marginBottom: 5,
  },

  errorButton: {
    marginBottom: 1,
  },

  button: {
    paddingLeft: 10,
    display: 'inline-flex',
    justifyContent: 'flex-end',
  },

  list: {
    paddingTop: 0,
    paddingLeft: 25,
  },
}));

export default LocalizationTableUploaderStyles;
