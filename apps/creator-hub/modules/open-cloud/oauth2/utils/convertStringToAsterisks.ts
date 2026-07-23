/**
 * Function that replaces a string with a string of asterisks of the same
 * length. Useful for converting strings to a 'secret' format.
 * @param baseString the string to convert
 * @returns a string of asterisks with the same length as param
 */
export default function convertStringToAsterisks(baseString: string): string {
  return '*'.repeat(baseString.length);
}
