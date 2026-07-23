/**
 * Tests if an input string is specifically null or the empty string. Any other values
 * (including undefined!) will return false.
 * @param str The string to test
 * @returns true iff the argument is null or the empty string
 */
export default function isStringNullOrEmpty(str: string | null | undefined): boolean {
  return str === null || str === '';
}
