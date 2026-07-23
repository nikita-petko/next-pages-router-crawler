import { makeStyles } from '@rbx/ui';

const marginUnit = 8;
const useStripeFormStyles = makeStyles()((theme) => ({
  stripeFormHeader: {
    display: 'block',
    marginTop: marginUnit * 3,
    marginBottom: marginUnit * 2,
  },
  billingAddressFormHeader: {
    display: 'block',
    marginTop: marginUnit * 3,
    marginBottom: marginUnit * 2,
  },
  bottomDivider: {
    display: 'block',
    marginBottom: marginUnit * 4,
    marginTop: marginUnit * 4,
  },
  cancelButton: {
    marginRight: marginUnit,
    textTransform: 'none',
  },
  buttonContainer: {
    marginTop: marginUnit,
    paddingBottom: marginUnit * 2,
  },
  accountAuthContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: marginUnit * 3,
  },
  accountAuthRequired: {
    display: 'block',
  },
  accountAuthDescription: {
    display: 'block',
    color: theme.palette.content.muted,
  },
  saveButton: {
    textTransform: 'none',
    paddingLeft: 24,
    paddingRight: 24,
  },
  circularSpace: {
    marginRight: '10px',
  },
}));
export default useStripeFormStyles;
