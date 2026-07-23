import type { ValidationSchema } from '@modules/monetization-shared/react-hook-form';
import { MAX_USERS } from './constants';
import type { PriceValidationFormValues } from './types';

/**
 * Validation schema for `PriceValidationForm`.
 */
export const priceValidationSchema = {
  users: {
    required: true,
    minLength: 1,
    maxLength: MAX_USERS,
  },
  testing: {
    required: true,
  },
  price: {
    // Make price required only if testing is price
    validate: (value, { testing }) => {
      if (testing === 'price') {
        return value !== null;
      }
      return true;
    },
    deps: ['testing'],
  },
  location: {
    // Make location required only if testing is location
    validate: (value, { testing }) => {
      if (testing === 'location') {
        return value !== null;
      }
      return true;
    },
    deps: ['testing'],
  },
} as const satisfies ValidationSchema<PriceValidationFormValues>;
