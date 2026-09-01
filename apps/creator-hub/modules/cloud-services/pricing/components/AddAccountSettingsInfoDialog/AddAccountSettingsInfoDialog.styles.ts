import { makeStyles } from '@rbx/ui';

const marginUnit = 8;
const useAddAccountSettingsInfoDialogStyles = makeStyles()(() => ({
  bottomDivider: {
    display: 'block',
    marginBottom: marginUnit * 3,
    paddingBottom: marginUnit * 2,
    marginTop: marginUnit * 2,
  },
  accountDescription: {
    marginTop: marginUnit,
    paddingBottom: marginUnit * 3,
  },
  buttonContainer: {
    marginBottom: marginUnit * 3,
    textAlign: 'right',
  },
  saveButton: {
    paddingRight: marginUnit * 3,
    paddingLeft: marginUnit * 3,
    marginLeft: marginUnit * 2,
    textTransform: 'none',
  },
  cancelButton: {
    paddingRight: marginUnit * 2,
    paddingLeft: marginUnit * 2,
    textTransform: 'none',
  },
  topDivider: {
    marginTop: marginUnit * 2,
    marginBottom: marginUnit * 2,
  },
}));
export default useAddAccountSettingsInfoDialogStyles;
