/**
 *
 * @returns the array of cookies
 */
export function getAllCookies(): string[] {
  return document?.cookie?.split('; ') ?? [];
}

/**
 * Return the value of the cookie by the giving key. e.g <key>=<value> , return value
 *
 * @param key
 * @returns the value of cookie by the given key or null if the key is not
 * available
 */
export function getCookieValueByKey(key: string): string | null {
  const allCookies = getAllCookies();
  const lengthOfKey = key.length;
  const value = allCookies?.find((row) => row.startsWith(key))?.substring(lengthOfKey + 1); // take string after `key=`
  return value ?? null;
}

/**
 * Return the full cookie string by the given keyword. e.g.
 * <key>=<keyword=value:test> , return `<key>=<keyword=value:test>`
 * @param keyword
 * @returns the entire string by the given keyword or null if the keyword is not
 * found
 */
export function getCookieByKeyword(keyword: string): string | null {
  const allCookies = getAllCookies();
  const result = allCookies?.find((row) => row.includes(keyword));
  return result ?? null;
}

export default {
  getAllCookies,
  getCookieValueByKey,
  getCookieByKeyword,
};
