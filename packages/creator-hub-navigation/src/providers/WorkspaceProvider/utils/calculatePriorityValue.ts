const ONE_DAY = 24 * 60 * 60 * 1000;

/**
 * Calculates a priority value based on a base value and the time elapsed since the last update.
 *
 * The function takes into account the current time and the last updated timestamp to compute
 * a time factor. This time factor is logarithmically scaled to ensure diminishing returns
 * over time. The resulting priority value is the product of the base value and the adjusted
 * time factor.
 */
const calculatePriorityValue = (baseValue: number, lastSelected: number): number => {
  const now = Date.now();
  const timeDifference = Math.max(now - lastSelected, ONE_DAY);
  const timeFactor = Math.log10(1 + 10 / timeDifference);
  return baseValue * (1 + timeFactor);
};

export default calculatePriorityValue;
