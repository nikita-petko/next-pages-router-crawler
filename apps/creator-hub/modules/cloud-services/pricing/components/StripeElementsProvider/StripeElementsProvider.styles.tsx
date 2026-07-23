import { makeStyles } from '@rbx/ui';
import { getThemedStripeOptions } from '../shared/stripeConstants';

const marginUnit = 8;
const useStripeElementsProviderStyles = makeStyles()((theme) => ({
  dividerTop: {
    display: 'block',
    marginBottom: marginUnit,
    marginTop: marginUnit,
  },

  addPaymentMethodDescription: {
    display: 'block',
    marginBottom: marginUnit * 4,
    color: theme.palette.content.muted,
  },
  stripeOptions: {
    appearance: getThemedStripeOptions(theme),
  },
}));
export default useStripeElementsProviderStyles;
