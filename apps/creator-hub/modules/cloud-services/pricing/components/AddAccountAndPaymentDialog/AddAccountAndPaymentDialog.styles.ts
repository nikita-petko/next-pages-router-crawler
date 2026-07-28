import { makeStyles } from '@rbx/ui';

const marginUnit = 8;
const useAddAccountAndPaymentDialogStyles = makeStyles()(() => ({
  topDivider: {
    display: 'block',
    paddingBottom: -4,
    marginTop: marginUnit * 2,
  },
  upperStepper: {
    marginTop: marginUnit * 4,
    marginBottom: marginUnit * 5,
  },
  addPaymentMethodHeader: {
    display: 'block',
    marginBottom: marginUnit,
  },
  addPaymentMethodDescription: {
    display: 'block',
    marginBottom: marginUnit * 4,
  },
}));
export default useAddAccountAndPaymentDialogStyles;
