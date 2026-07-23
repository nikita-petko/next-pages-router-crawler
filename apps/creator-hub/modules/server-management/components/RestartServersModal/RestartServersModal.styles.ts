import { makeStyles } from '@rbx/ui';

const useRestartServersModalStyles = makeStyles()(() => ({
  dialogPaper: {
    maxWidth: 836,
    width: '100%',
    paddingTop: 32,
    paddingRight: 32,
    paddingBottom: 0,
    paddingLeft: 32,
  },
  impactCard: {
    padding: 16,
    textAlign: 'start',
    minWidth: 120,
  },
  dialogTitle: {
    padding: 0,
    marginBottom: 16,
  },
  dialogContent: {
    padding: 0,
  },
  gridContainer: {
    paddingTop: 16,
  },
  checkboxContainer: {
    alignItems: 'flex-start',
  },
  checkboxContainerWithSpacing: {
    alignItems: 'flex-start',
  },
  flexItem: {
    flex: 1,
  },
  titleMedium: {
    marginBottom: 4,
  },
  bodyText: {
    display: 'block',
  },
  bodyText2: {
    fontSize: 12,
    fontWeight: 700,
  },
  timeLabel: {
    marginTop: 12,
  },
  textField: {
    marginTop: 4,
    width: 93,
    '& .MuiFormHelperText-root': {
      marginLeft: 0,
      whiteSpace: 'nowrap',
      overflow: 'visible',
    },
    '& .MuiInputBase-input': {
      height: 0.5,
      padding: '6 12 6 12',
    },
  },
  textFieldInput: {
    height: 0.5,
    padding: '6 12 6 12',
  },
  impactSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  impactTitle: {
    marginTop: 16,
  },
  impactValue: {
    display: 'block',
    marginTop: 4,
  },
  dialogActions: {
    padding: '16 0 0 0',
    paddingRight: 0,
  },

  errorMessage: {
    whiteSpace: 'nowrap',
    marginTop: 4,
  },
}));

export default useRestartServersModalStyles;
