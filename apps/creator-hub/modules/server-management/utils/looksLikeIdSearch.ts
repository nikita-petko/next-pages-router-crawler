import isNumericString from './isNumericString';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const looksLikeIdSearch = (value: string): boolean => {
  const trimmed = value.trim();
  return trimmed.length > 0 && (UUID_RE.test(trimmed) || isNumericString(trimmed));
};

export default looksLikeIdSearch;
