import { BatchRequestProperties, DefaultCooldown } from './batchRequestConstants';

export const createExponentialBackoffCooldown = (
  minimumCooldown: number,
  maximumCooldown: number
) => {
  return (attempts: number) => {
    const exponentialCooldown = 2 ** (attempts - 1) * minimumCooldown;
    return Math.min(maximumCooldown, exponentialCooldown);
  };
};

export const getFailureCooldown = (attempts: number, properties: BatchRequestProperties) => {
  if (properties.getFailureCooldown) {
    return properties.getFailureCooldown(attempts);
  }

  return DefaultCooldown;
};
