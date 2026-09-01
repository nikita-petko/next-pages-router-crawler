import type { UniversePinningStatus } from '@modules/clients/priceConfigurationApi';

/**
 * @param {UniversePinningStatus} status
 * @returns Whether config status is in a polling state
 */
export const isPollingStatus = (status?: UniversePinningStatus): boolean => {
  if (!status) {
    return false;
  }

  return status === 'Enabling' || status === 'Disabling';
};

/**
 * @param {UniversePinningStatus} status
 * @returns Whether config status is active (not disabled)
 */
export const isActiveStatus = (status?: UniversePinningStatus): boolean => {
  if (!status) {
    return false;
  }

  return status !== 'Disabled';
};
