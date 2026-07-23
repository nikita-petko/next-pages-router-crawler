import type { NativeValidationSchema } from '@modules/monetization-shared/react-hook-form';
import type { ConfigureDeveloperProductFormV2Values } from '../../types';

export const MAX_NAME_LENGTH = 50;
export const MAX_DESCRIPTION_LENGTH = 1000;
export const MIN_PRICE = 1;
// Note: this is dynamically set in both developer-products-api AND price-engine. We should make this dynamic with the string
export const MAX_PRICE = 1_000_000_000;

export const configureDeveloperProductSchema = {
  name: {
    required: 'Error.Required',
    maxLength: MAX_NAME_LENGTH,
  },
  description: {
    maxLength: MAX_DESCRIPTION_LENGTH,
  },
  price: {
    // Manually transform to a valid numeric input
    setValueAs: (value: string | null): number | null => {
      if (value === '' || value === null) {
        return null;
      }

      return Number(value);
    },
    min: { value: MIN_PRICE, message: 'Error.InvalidPriceInRobux' },
    max: { value: MAX_PRICE, message: 'Error.InvalidPriceInRobux' },
    validate: (value, { isRegionalPricingEnabled, storePageEnabled }) => {
      if (value !== null && (Number.isNaN(value) || Math.trunc(value) !== value)) {
        return 'Error.InvalidNumber';
      }

      // Price must be set to enable regional pricing or EDP
      if (value === null && isRegionalPricingEnabled) {
        return false; // No error message as required in form
      }

      if (value === null && storePageEnabled) {
        return false; // No error message as required in form
      }

      return true;
    },
  },
  file: {},
} satisfies NativeValidationSchema<ConfigureDeveloperProductFormV2Values>;
