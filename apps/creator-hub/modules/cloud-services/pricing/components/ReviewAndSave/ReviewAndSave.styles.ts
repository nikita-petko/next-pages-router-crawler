import { makeStyles } from '@rbx/ui';

const marginUnit = 8;

const useReviewAndSaveStyles = makeStyles()(() => ({
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
  cardTitle: {
    paddingBottom: 32,
  },
  cardBox: {
    height: '100%',
    width: '100%',
    minWidth: '100%',
  },
  saveTaxId: {
    paddingTop: 32,
  },
  saveTaxIdDescription: {
    paddingBottom: -8,
  },
  paymentDescription: {
    paddingTop: 8,
  },
  cardContainer: {
    paddingBottom: 16,
  },
  buttonContainer: {
    marginTop: 8,
    paddingtop: 8,
    paddingBottom: 8,
  },
  bottomDivider: {
    marginTop: 8,
    marginBottom: 8,
  },
  loadingProgress: {
    marginRight: 8,
  },
}));

export default useReviewAndSaveStyles;
