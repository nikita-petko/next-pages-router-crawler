import { makeStyles } from '@rbx/ui';

const marginUnit = 8;

const useRetryPaymentDialogStyles = makeStyles()(() => ({
  headingDivider: {
    display: 'block',
    marginTop: marginUnit,
    marginBottom: marginUnit * 2,
  },
  headingDescription: {
    marginBottom: marginUnit * 4,
  },
  topDivider: {
    display: 'block',
    marginBottom: marginUnit * 4,
    marginTop: marginUnit * 2,
  },
  addPaymentMethodHeader: {
    display: 'block',
    marginBottom: marginUnit,
  },
  addPaymentMethodDescription: {
    display: 'block',
    marginBottom: marginUnit * 2,
  },
  paymentIcons: {
    display: 'flex',
    alignItems: 'center',
  },
  paymentContainer: {},
  buttonContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: marginUnit,
  },
  closeButton: {
    marginRight: '10px',
  },
}));

export default useRetryPaymentDialogStyles;
