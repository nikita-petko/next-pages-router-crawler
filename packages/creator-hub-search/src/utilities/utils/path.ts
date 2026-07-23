export const DocsSitePathPrefix = '/docs';
export const DocsSitePathSlug = 'docs';

// TODO (@ahua, CRK-3699): enforce that path has a leading slash by default;
// eventually fix trailing slash handling (dedupe pages with trailing slash and without)
export type LeadingSlashPath = `/${string}`;
type LeadingSlashPathWithTrailingSlash = `/${string}/`;
export type LeadingSlashPathWithoutTrailingSlash = Exclude<
  `/${string}`,
  LeadingSlashPathWithTrailingSlash
>;
export const isLeadingSlashPath = (str: string): str is LeadingSlashPath => str.startsWith('/');
export const isLeadingSlashPathWithoutTrailingSlash = (
  str: string,
): str is LeadingSlashPathWithoutTrailingSlash =>
  isLeadingSlashPath(str) && !str.endsWith('/') && !str.startsWith(DocsSitePathPrefix);

/* eslint-disable no-param-reassign */
const delimiter = '/';

function joinTwoPaths(path1: string, path2: string) {
  if (!path1 && !path2) {
    return '';
  }
  if (!path1) {
    return path2;
  }
  if (!path2) {
    return path1;
  }
  if (path1.endsWith(delimiter) && path2.startsWith(delimiter)) {
    return path1 + path2.substring(1);
  }
  if (path1.endsWith(delimiter) || path2.startsWith(delimiter)) {
    return path1 + path2;
  }
  return path1 + delimiter + path2;
}

export function join(...paths: string[]) {
  if (paths.length === 0) {
    return '';
  }
  if (paths.length === 1) {
    return paths[0];
  }
  return paths.reduce((res, curPath) => {
    return joinTwoPaths(res, curPath);
  });
}

// eslint-disable-next-line prefer-regex-literals
export const LOCALE_SLUG_REGEXP = new RegExp('^[a-z]{2}-[a-z]{2}$');
// eslint-disable-next-line prefer-regex-literals
export const LOCALE_SLUG_WITH_SLASHES_REGEXP = new RegExp('/[a-z]{2}-[a-z]{2}/');

export function isLocalePathSlug(path: string) {
  return LOCALE_SLUG_REGEXP.test(path);
}
export function hasLocalePathWithSlashes(path: string) {
  return LOCALE_SLUG_WITH_SLASHES_REGEXP.test(path);
}

export function resolve(base: string, path: string) {
  if (isLeadingSlashPath(path)) {
    return path;
  }
  return join(base, path);
}

export function isAbsolutePath(path: string) {
  return path.startsWith('//') || /https?:\/\//.test(path) || /roblox:\/\//.test(path);
}

// TODO (@ahua, CRK-3699): replace in the future with a more robust solution
export function removeTrailingSlash(path: string) {
  // for single char '/' we dont remove;
  if (path.endsWith(delimiter) && path.length > 1) {
    return path.substring(0, path.length - 1);
  }
  return path;
}

export function cleanPath(path: string) {
  // remove query param and trailing slash
  return removeTrailingSlash(path.replace(/\?.*$/, ''));
}

export function addTrailingSlash(path: string) {
  if (path.endsWith(delimiter)) {
    return path;
  }
  return path + delimiter;
}

export function addLeadingSlash(path: string): LeadingSlashPath {
  if (isLeadingSlashPath(path)) {
    return path;
  }
  return (delimiter + path) as LeadingSlashPath;
}

export function removeLeadingSlash(path: string) {
  if (path.startsWith(delimiter)) {
    return path.substring(1);
  }
  return path;
}

export function getRelativePath(base: string, path: string) {
  if (!isLeadingSlashPath(path)) {
    return path;
  }
  if (!path.startsWith(base)) {
    throw Error(`path is not started with base: ${base} ${path}`);
  }
  return removeLeadingSlash(path.substring(base.length));
}

export default {
  join,
  getRelativePath,
  resolve,
};
