/**
 * Helper function to extract a translation key from a CloudAuthResponseErrorType object.
 * As of 8/11/21, we only support extraction of a single translation key; currently a backend response looks like
 * "Status(StatusCode=\"InvalidArgument\", Detail=\"Response.FieldContainsDisallowedChars\"
 * Our goal is to extract the "Response.FieldContainsDisallowedChars"; this may be need to be extended in the future if
 * detail can potentially contain multiple translation keys.
 * @param input the string that our regex will look for
 * @returns the translation key as a string if a pattern was found, or null if no key was found
 */
export default function extractTranslationKey(input: string) {
  // Check for strings of the form {String}.{String}
  const regex = input.match(/([A-Za-z])+\.[A-Za-z]+/g);
  return regex ? regex[0] : null;
}
