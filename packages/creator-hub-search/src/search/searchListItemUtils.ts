import { TITLE_SEPARATOR } from '@rbx/creator-hub-history';
import type { UseTranslationResult } from '@rbx/intl';
import type { TIconProps } from '@rbx/ui';
import { DocumentationContentType } from '../clients/docSiteSearchType';
import { NavigationTypeRawLabelMap } from '../utilities/pageBuild/types/NavigationRaw';
import type { TSearchListItem } from './types/SearchListItem';

const EXPERIENCE_PATH_PATTERN = /\/dashboard\/creations\/experiences\/(\d+)/;

/**
 * Determines if a search list item represents an experience page.
 * Checks hubType metadata first, then falls back to URL pattern matching.
 */
export function isExperienceItem(item: TSearchListItem): boolean {
  if (item.hubType === 'experience') {
    return true;
  }
  if (item.path && EXPERIENCE_PATH_PATTERN.test(item.path)) {
    return true;
  }
  return false;
}

/**
 * Extracts the universe ID from an experience item.
 * Prefers entityId from metadata, falls back to parsing the URL path.
 */
export function getExperienceUniverseId(item: TSearchListItem): number | null {
  if (item.entityId) {
    const parsed = parseInt(item.entityId, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  if (item.path) {
    const match = item.path.match(EXPERIENCE_PATH_PATTERN);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  return null;
}

export const DISPLAY_SEPARATOR = ' \u{25AA} ';

export type EndAdornment = {
  Icon: React.FC<TIconProps>;
  label?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
};

export const placeholderEndAdornment: EndAdornment = {
  Icon: () => null,
};

export const getSearchListItemLabelTranslated = (
  item: TSearchListItem,
  translate: UseTranslationResult['translate'],
): string => {
  if (!item.label) {
    return '';
  }
  if (typeof item.label === 'string') {
    return item.label;
  }
  if (typeof item.label === 'object' && 'translationKey' in item.label) {
    return translate(item.label.translationKey, item.label.translationKeyParams);
  }
  return '';
};

export const getSearchListItemTypeTranslated = (
  item: TSearchListItem,
  translate: UseTranslationResult['translate'],
): string => {
  if (!item.type) {
    return translate('Label.Article');
  }
  return translate(NavigationTypeRawLabelMap[item.type] ?? 'Label.Article');
};

export const getDefaultAriaLabel = (
  item: TSearchListItem,
  itemLabel: string,
  translate: UseTranslationResult['translate'],
): string => {
  if (itemLabel) {
    return translate('Label.GoToPage', {
      type: getSearchListItemTypeTranslated(item, translate),
      label: itemLabel,
      title: item.title,
    });
  }
  return translate('Label.GoToPageNoLabel', {
    type: getSearchListItemTypeTranslated(item, translate),
    title: item.title,
  });
};

/**
 * Build the breadcrumb context string from entityName and hub breadcrumb segments.
 *
 * For experience pages:   "Apple / Analytics"
 * For non-experience pages: "Experiences"
 * Returns empty string if there's no context.
 */
export const getBreadcrumbContext = (item: TSearchListItem): string => {
  return item.hubBreadcrumb ?? '';
};

/**
 * Returns the parts of the secondary display line used by
 * `SecondaryDisplayText` to render alongside the breadcrumb.
 *
 * `detailText` is user-controlled plain text (e.g. group / creator name) and
 * must always be rendered as text — never as HTML. `detailHtml` is the
 * highlight markup returned by the docs search backend (e.g. a
 * `<strong class="query-highlight">` wrapped match in the page description) and
 * should be passed through `sanitizeHighlightHtml` before being injected into
 * the DOM.
 *
 * Keeping these as two distinct fields prevents the Stored XSS, where a group
 * name was concatenated into a value that downstream code then rendered with
 * `dangerouslySetInnerHTML`.
 */
export const getSecondaryDisplayParts = (
  item: TSearchListItem,
): { breadcrumb: string; detailText: string; detailHtml: string } => {
  const breadcrumb = getBreadcrumbContext(item);
  const isCreatorHub = item.documentationContentType === DocumentationContentType.CreatorHub;

  if (item.authorName) {
    return { breadcrumb, detailText: item.authorName, detailHtml: '' };
  }
  if (!isCreatorHub && item.description) {
    return { breadcrumb, detailText: '', detailHtml: item.description };
  }
  return { breadcrumb, detailText: '', detailHtml: '' };
};

/**
 * Build the secondary display text (breadcrumb context + author/description).
 *
 * Experience pages:      "Apple / Analytics▪user12345"
 * Non-experience pages:  "Experiences▪Make anything you can imagine..."
 */
export const getSecondaryDisplayText = (item: TSearchListItem): string => {
  const { breadcrumb, detailText, detailHtml } = getSecondaryDisplayParts(item);
  const parts = [breadcrumb, detailText || detailHtml].filter(Boolean);
  return parts.join(DISPLAY_SEPARATOR);
};

/**
 * Whether this item has breadcrumb-style display data
 * (i.e. it's a Creator Hub history item with structured metadata).
 */
export const hasBreadcrumbDisplay = (item: TSearchListItem): boolean =>
  !!(item.entityName ?? item.hubBreadcrumb ?? item.authorName);

/**
 * Whether SecondaryDisplayText should render for this item.
 * Only true when Creator-Hub-specific breadcrumb metadata exists
 * (hubBreadcrumb or authorName). Bare description alone is NOT sufficient —
 * items with only a description should fall through to the standard
 * category / dangerouslySetInnerHTML branches in SearchListItem.
 */
export const hasSecondaryDisplayContent = (item: TSearchListItem): boolean => {
  return !!(item.hubBreadcrumb ?? item.authorName);
};

/**
 * Parse a slash-separated title into display title and breadcrumb segments.
 *
 * Creator Hub search index titles for experience pages include the
 * breadcrumb path, e.g. " Analytics / Custom Events". This splits on
 * TITLE_SEPARATOR and returns the last segment as the display title,
 * with preceding segments as the hub breadcrumb context.
 *
 * Examples:
 *   " Analytics / Custom Events" → { displayTitle: "Custom Events", hubBreadcrumb: "Analytics" }
 *   "Access Settings"            → { displayTitle: "Access Settings", hubBreadcrumb: undefined }
 *   " Custom Events"             → { displayTitle: "Custom Events", hubBreadcrumb: undefined }
 */
export const parseTitleBreadcrumb = (
  title: string,
): { displayTitle: string; hubBreadcrumb: string | undefined } => {
  const parts = title.split(TITLE_SEPARATOR).map((s) => s.trim());
  const displayTitle = parts[parts.length - 1] || title.trim();

  let breadcrumbParts = parts.length > 1 ? parts.slice(0, -1) : [];
  if (breadcrumbParts.length > 0 && breadcrumbParts[breadcrumbParts.length - 1] === displayTitle) {
    breadcrumbParts = breadcrumbParts.slice(0, -1);
  }

  const hubBreadcrumb =
    breadcrumbParts.length > 0 ? breadcrumbParts.join(TITLE_SEPARATOR) : undefined;
  return { displayTitle, hubBreadcrumb };
};

/**
 * Extract the hub breadcrumb segments from a search result's full breadcrumb path.
 *
 * The full breadcrumb from the search index looks like:
 *   "Creations / Apple / Analytics / Acquisition"
 *    ^top-level   ^experienceName  ^section  ^title(last)
 *
 * This function strips the first segment (top-level category),
 * the last segment (page title), and the experienceName (shown separately
 * as entityName) to return the remaining intermediate segments.
 *
 * Examples:
 *   ("Creations / Apple / Analytics / Acquisition", "Apple") → "Analytics"
 *   ("Creations / Apple / Access Settings", "Apple")         → ""
 *   ("Account Information", undefined)                        → ""
 */
export const extractHubBreadcrumb = (
  breadcrumb: string | undefined,
  experienceName: string | undefined,
): string | undefined => {
  if (!breadcrumb) {
    return undefined;
  }

  const parts = breadcrumb.split(TITLE_SEPARATOR).map((s) => s.trim());

  if (parts.length <= 2) {
    return undefined;
  }

  const middle = parts.slice(1, -1);

  if (experienceName) {
    const filtered = middle.filter((s) => s !== experienceName);
    return filtered.length > 0 ? filtered.join(TITLE_SEPARATOR) : undefined;
  }

  return middle.length > 0 ? middle.join(TITLE_SEPARATOR) : undefined;
};
