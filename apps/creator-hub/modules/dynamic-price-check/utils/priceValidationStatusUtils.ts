import { PriceValidationConfigStatus } from '../types';

/**
 * @param {PriceValidationConfigStatus} status
 * @returns Whether config status is in a polling state
 */
export const isPollingStatus = (status?: PriceValidationConfigStatus): boolean => {
  if (!status) {
    return false;
  }

  return status === 'Enabling' || status === 'Disabling';
};

/**
 * @param {PriceValidationConfigStatus} status
 * @returns Whether config status is active (not disabled)
 */
export const isActiveStatus = (status?: PriceValidationConfigStatus): boolean => {
  if (!status) {
    return false;
  }

  return status !== 'Disabled';
};
