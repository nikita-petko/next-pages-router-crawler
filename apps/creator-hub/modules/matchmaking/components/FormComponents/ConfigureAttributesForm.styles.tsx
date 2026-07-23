import { makeStyles } from '@rbx/ui';

const useConfigureAttributesFormStyles = makeStyles()(() => ({
  button: {
    marginRight: 10,
  },
  buttonContainer: {
    marginTop: 30,
  },
  errorMessageStyles: {
    width: '100%',
    marginTop: 4,
    paddingLeft: 14,
    paddingRight: 14,
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  dataStoreFormContainer: {
    marginTop: 30,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  divider: {
    marginTop: 20,
  },
  title: {
    gap: 20,
    marginBottom: 30,
  },
  dataStoreTitleContainer: {
    gap: 20,
  },
  dialogBoxDescription: {
    marginTop: 20,
    marginBottom: 20,
  },
}));

export default useConfigureAttributesFormStyles;
