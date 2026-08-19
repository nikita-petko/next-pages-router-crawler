/**
 * Util function that copies a given string to a user's clipboard
 * @param stringToCopy the string to copy to clipboard
 */
export default function copyToClipboard(stringToCopy: string): void {
  navigator.clipboard.writeText(stringToCopy);
}
