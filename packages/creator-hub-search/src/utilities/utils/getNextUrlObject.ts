import type { UrlObject } from 'node:url';
import type { Locale } from '@rbx/intl';
import pathsWithNoLocale from '../../localization/utils/localeUtils';
import isIndexPath from './isIndexPath';
import { addLeadingSlash, isAbsolutePath, isLocalePathSlug } from './path';

// ref: https://nextjs.org/docs/pages/api-reference/components/link#with-url-object
const getNextUrlObject = (
  path: string,
  isLocalePrefixed: boolean,
  locale: Locale,
): string | UrlObject => {
  if (path.startsWith('#') || isAbsolutePath(path)) {
    throw new Error(
      `getNextUrlObject should only handle paths between in-app pages. Got path ${path}`,
    );
  }

  if (isIndexPath(addLeadingSlash(path))) {
    if (isLocalePrefixed) {
      return {
        pathname: '/[locale]',
        query: {
          locale: locale.toLowerCase(),
        },
      };
    }
    return {
      pathname: '/',
    };
  }

  const [basePath, hash = ''] = path.split('#');
  const slugs = basePath.split('/').filter(Boolean);

  // NOTE (tchu, 2025-08-22):
  // This is a special case for paths that should not have a locale prefix.
  // For example, /assistant, /courses, etc.
  if (pathsWithNoLocale.has(basePath)) {
    return {
      pathname: basePath,
    };
  }

  // Add locale prefix if it isn't present but should be
  if (isLocalePrefixed && !isLocalePathSlug(slugs[0])) {
    slugs.unshift(locale.toLowerCase());
  }

  return {
    pathname: '/[[...slugs]]',
    query: {
      slugs,
    },
    ...(hash ? { hash } : {}),
  };
};

export default getNextUrlObject;
