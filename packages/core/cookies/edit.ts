import type SameSite from './enums/SameSite';

type SetCookieValueType = string | number | boolean;

export interface SetCookieOptions {
  path?: string;
  expires?: string;
  'max-age'?: number;
  domain?: string;
  secure?: boolean;
  samesite?: SameSite;
}

function getBaseDomain() {
  const parts = window.location.hostname.split('.');
  if (parts.length <= 2) {
    return window.location.hostname;
  }
  // Return the domain one-level up
  return `.${parts.slice(1).join('.')}`;
}

/**
 * Creates/updates a cookie with a given value and (optional) properties
 * @param key the name of the cookie
 * @param value the value of the cookie
 * @param options the optional parameters of the cookie
 */
export function setCookie(
  key: string,
  value: SetCookieValueType,
  options: SetCookieOptions = {},
): void {
  const newCookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  const newCookieOptions = Object.entries(options)
    .map(([optionKey, optionValue]) => {
      if (optionValue !== 'undefined') {
        if (typeof optionValue !== 'boolean') {
          return `${optionKey}=${optionValue}`;
        }
        if (optionValue === true) {
          // For boolean properties like "secure", the presence of the optionKey
          // itself indicates that its value is true, so no need to include the
          // optionValue
          return `${optionKey}`;
        }
      }
      return '';
    })
    .join('; ');

  document.cookie = newCookieOptions ? `${newCookie}; ${newCookieOptions}` : newCookie;
}

export function deleteCookie(key: string): void {
  const keys = document.cookie.split('; ').map((value: string) => value.split('=')[0]);
  if (!keys.includes(key)) {
    return;
  }
  document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${getBaseDomain()}`;
}

export default {
  setCookie,
  deleteCookie,
};
