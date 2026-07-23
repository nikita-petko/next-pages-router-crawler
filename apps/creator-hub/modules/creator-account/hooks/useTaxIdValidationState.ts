import { useMemo } from 'react';
import { TaxIdType } from '@modules/clients/brandPlatform';
import { TaxIdValidationState } from '../types';

/**
 * Custom hook to calculate the tax ID validation state.
 *
 * @param taxIdType - The selected tax ID type
 * @param taxIdValue - The current tax ID value
 * @returns The current validation state
 */
const useTaxIdValidationState = (
  taxIdType: TaxIdType | null | undefined,
  taxIdValue: string | undefined,
): TaxIdValidationState => {
  return useMemo((): TaxIdValidationState => {
    const hasValidType = taxIdType && taxIdType !== TaxIdType.Invalid;
    const hasValue = Boolean(taxIdValue);
    const isMasked = taxIdValue?.startsWith('*');

    if (isMasked) {
      return TaxIdValidationState.Masked;
    }
    if (!hasValidType && !hasValue) {
      return TaxIdValidationState.Empty;
    }
    if (hasValidType && !hasValue) {
      return TaxIdValidationState.TypeOnly;
    }
    if (!hasValidType && hasValue) {
      return TaxIdValidationState.IdOnly;
    }
    return TaxIdValidationState.Complete;
  }, [taxIdType, taxIdValue]);
};

export default useTaxIdValidationState;
