import { escapeHtmlString } from './escape-html';

/**
 * Matches ASCII control characters (C0 controls + DEL). Browsers strip or
 * normalize these when parsing URLs — e.g. `java\tscript:alert(1)` becomes
 * `javascript:alert(1)` — so any URL containing them is treated as untrusted
 * and rejected outright to prevent scheme-check bypasses.
 */
// eslint-disable-next-line no-control-regex
const CONTROL_CHAR_REGEX = /[\u0000-\u001F\u007F]/;

/**
 * Scheme allowlist for image URLs rendered into `<img src="...">` via
 * `useHTML: true` chart formatters. Only absolute `https://` URLs are
 * permitted; anything else (including `javascript:`, `data:`, `vbscript:`,
 * `file:`, protocol-relative `//host`, and same-origin relative paths) is
 * rejected.
 *
 * The returned string is HTML-attribute-safe: characters that could break out
 * of the surrounding `src="..."` attribute (`"`, `<`, `>`, `&`, `'`) are
 * replaced with their HTML entities.
 *
 * @returns The sanitized URL, or an empty string if the input is not safe.
 */
const sanitizeImageUrl = (url: unknown): string => {
  if (typeof url !== 'string') {
    return '';
  }
  if (CONTROL_CHAR_REGEX.test(url)) {
    return '';
  }

  const trimmed = url.trim();
  if (!/^https:\/\//i.test(trimmed)) {
    return '';
  }

  return escapeHtmlString(trimmed);
};

export default sanitizeImageUrl;
