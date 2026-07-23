import { availableDocsContentLocales } from '../../localization/constants/translationResourceConstants';
import { LeadingSlashPath, removeTrailingSlash } from './path';

const indexRelativePaths = ['/'].concat(
  availableDocsContentLocales.map((locale) => `/${locale?.toLowerCase() ?? ''}`),
);

const isIndexPath = (path: LeadingSlashPath): boolean =>
  indexRelativePaths.includes(removeTrailingSlash(path));

export default isIndexPath;
