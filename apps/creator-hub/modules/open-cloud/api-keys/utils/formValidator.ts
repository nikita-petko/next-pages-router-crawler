import type CloudAuthConfiguredStateProperties from '../interfaces/CloudAuthConfiguredStateProperties';

/**
 * Generic validator function that can be used across create (duplicate) and edit forms
 * @param state a state object that extends the CloudAuthConfiguredStateProperties interface
 * @returns boolean indicating if the state is valid for submission
 */
export default function isValid<T extends CloudAuthConfiguredStateProperties>(state: T): boolean {
  if (!!!state.apiKeyName) {
    // name cannot be an empty string or undefined
    return false;
  }
  if (state.acceptedIps.length === 0) {
    // ips list cannot be empty
    return false;
  }
  return true;
}
