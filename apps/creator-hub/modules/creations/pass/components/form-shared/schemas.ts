import type { NativeValidationSchema } from '@modules/monetization-shared/react-hook-form';
import type { ConfigurePassMetadataFormValues, ConfigureSalesFormValues } from './types';

// ================================
// Metadata configuration
// ================================

export const MAX_NAME_LENGTH = 50;
export const MAX_DESCRIPTION_LENGTH = 1000;

export const configurePassMetadataSchema = {
  name: {
    required: 'Message.RequiredFieldMissed',
    // TODO: https://jira.rbx.com/browse/DSI-1794 use metadata endpoint to fetch max lengths
    maxLength: MAX_NAME_LENGTH,
  },
  description: { maxLength: MAX_DESCRIPTION_LENGTH },
  file: {},
} as const satisfies NativeValidationSchema<ConfigurePassMetadataFormValues>;

// ================================
// Sales configuration
// ================================

export const MIN_PASS_PRICE = 1;
export const MAX_PASS_PRICE = 999_999_999;

export const configurePassSalesSchema = {
  price: {
    // Manually transform to a valid numeric input
    setValueAs: (value: string | null): number | null => {
      if (value === '' || value === null) {
        return null;
      }

      return Number(value);
    },
    min: { value: MIN_PASS_PRICE, message: 'InputError.PriceTooLow' },
    max: { value: MAX_PASS_PRICE, message: 'InputError.PriceTooHigh' },
    validate: (value, { isForSale, isRegionalPricingEnabled }) => {
      if (value !== null && (Number.isNaN(value) || Math.trunc(value) !== value)) {
        return 'InputError.InvalidPrice';
      }

      // Price must be set to enable regional pricing
      if (value === null && isForSale && isRegionalPricingEnabled) {
        return false; // No error message as required in form
      }

      return true;
    },
  },
} as const satisfies NativeValidationSchema<ConfigureSalesFormValues>;
