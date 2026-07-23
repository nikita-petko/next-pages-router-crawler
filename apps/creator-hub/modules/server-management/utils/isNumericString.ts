/**
 * Utility function for numeric string validation
 */

/**
 * Validates if a string contains only digits
 * @param value - The string to validate
 * @returns true if the string contains only digits, false otherwise
 */
const isNumericString = (value: string): boolean => {
  return /^\d+$/.test(value);
};

export default isNumericString;
