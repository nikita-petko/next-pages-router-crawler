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
  // Note: this workaround with setValueAs and validation is needed due to underlying MUI TextField implementation
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

// NOTE(@jeminpark): we are temporarily using isRegionalPricingEnabled to match the old form such
// that components are reused. This should be changed to isManagedPricingEnabled in the future.
// NOTE(@jeminpark): note this is distinct from the old schema as this handles for native input validation rather than MUI TextField
export const configurePassSalesFormV2Schema = {
  price: {
    min: { value: MIN_PASS_PRICE, message: 'InputError.PriceTooLow' },
    max: { value: MAX_PASS_PRICE, message: 'InputError.PriceTooHigh' },
    valueAsNumber: true,
    validate: (value, { isForSale, isRegionalPricingEnabled: isManagedPricingEnabled }) => {
      if (value !== null && Number.isNaN(value)) {
        return 'InputError.InvalidPrice';
      }

      // Price must be set to be on sale or enable managed pricing
      if (value === null && (isForSale || isManagedPricingEnabled)) {
        return false; // No error message as required in form
      }

      return true;
    },
  },
} as const satisfies NativeValidationSchema<ConfigureSalesFormValues>;
