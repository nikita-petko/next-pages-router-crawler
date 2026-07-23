/* istanbul ignore file */

import { makeStyles } from '@rbx/ui';

const usePricingCalculatorSytles = makeStyles()(() => ({
  robuxAmount: {
    alignItems: 'center',
  },

  robuxAmountNumber: {
    lineHeight: '100%',
  },

  iconBig: {
    fontSize: '2.5rem',
    marginRight: 8,
  },
}));

export default usePricingCalculatorSytles;
