/**
 * Reads page metadata from the DOM.
 *
 * Priority: `hub:*` tags → `document.title` → `og:*` tags → standard `<meta>`.
 * Pages using `<HubMeta>` always emit both tiers, so `hub:*` values are
 * reliably present. For pages without `<HubMeta>`, the collector falls
 * back to standard SEO tags.
 */

import { HUB_META_PREFIX } from '../config';

/** Label can be a plain string or a structured translation object. */
export type CollectedLabel =
  | string
  | {
      translationKey: string;
      translationKeyParams?: Record<string, string>;
      defaultLabel?: string;
    };

/** All metadata fields that can be collected from the DOM. */
export type CollectedMetadata = {
  title: string;
  description?: string;
  siteName?: string;
  contentType?: string;
  authorName?: string;
  entityName?: string;
  entityId?: string;
  userId?: string;
  keywords?: string;
  /** Full breadcrumb path from hub:breadcrumb (e.g. "Settings / Notifications"). */
  breadcrumb?: string;
  /** Display label from hub:label — plain string or translation object. */
  label?: CollectedLabel;
  /** When true, the title should render in a monospace/code font. */
  isTitleCode?: boolean;
};

/**
 * Read the `content` attribute of a `<meta>` tag by property or name.
 * Checks `property` first (for og:* tags), then `name` (for standard tags).
 */
function getMetaContent(property: string): string | undefined {
  const el =
    document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`) ??
    document.querySelector<HTMLMetaElement>(`meta[name="${property}"]`);
  return el?.content || undefined;
}

/** Read a hub:* meta tag by key (without the prefix). */
function getHubMetaContent(hubKey: string): string | undefined {
  return getMetaContent(`${HUB_META_PREFIX}${hubKey}`);
}

/**
 * Read a hub:* tag, falling back to the og:* (or other standard) tag.
 * @param hubKey      Key without the hub: prefix (e.g. 'title', 'description').
 * @param fallbackKey Full property/name of the fallback tag (e.g. 'og:title').
 */
function getWithHubPriority(hubKey: string, fallbackKey: string): string | undefined {
  return getHubMetaContent(hubKey) || getMetaContent(fallbackKey) || undefined;
}

/**
 * Collects page metadata from the DOM in a single pass.
 *
 * Priority chain:  hub:*  >  document.title  >  og:*  >  standard meta
 *
 * Pages using `<HubMeta>` always emit both hub:* and standard tags.
 * The collector reads hub:* first (canonical for hub features),
 * falling back to standard tags for pages without `<HubMeta>`.
 *
 * Fields are only set when a value is found — absent tags produce
 * `undefined`, keeping the resulting object sparse.
 */
export function collectMetadata(): CollectedMetadata {
  // Title fallback: hub:title > <title> > og:title
  // document.title is preferred over og:title because many pages set a
  // specific <title> while their og:title remains generic.
  const title = getHubMetaContent('title') || document.title || getMetaContent('og:title') || '';

  const result: CollectedMetadata = { title };

  // Shared fields: hub:* canonical, og:* / standard fallback
  const description =
    getWithHubPriority('description', 'og:description') || getMetaContent('description');
  if (description) result.description = description;

  const siteName = getWithHubPriority('site_name', 'og:site_name');
  if (siteName) result.siteName = siteName;

  const contentType = getWithHubPriority('type', 'og:type');
  if (contentType) result.contentType = contentType;

  const authorName = getWithHubPriority('author', 'article:author');
  if (authorName) result.authorName = authorName;

  // Hub-only fields — no standard equivalent
  const entityName = getHubMetaContent('entity-name');
  if (entityName) result.entityName = entityName;

  const entityId = getHubMetaContent('entity-id');
  if (entityId) result.entityId = entityId;

  const userId = getHubMetaContent('user-id');
  if (userId) result.userId = userId;

  // SEO signals
  const keywords = getMetaContent('keywords');
  if (keywords) result.keywords = keywords;

  const breadcrumb = getHubMetaContent('breadcrumb');
  if (breadcrumb) result.breadcrumb = breadcrumb;

  // Display hints — used by search UI for recently visited items
  const labelRaw = getHubMetaContent('label');
  if (labelRaw) {
    try {
      result.label = JSON.parse(labelRaw);
    } catch {
      result.label = labelRaw;
    }
  }

  const isTitleCode = getHubMetaContent('is-title-code');
  if (isTitleCode === 'true') result.isTitleCode = true;

  return result;
}

/**
 * Stateless collector class — wraps {@link collectMetadata} so that
 * {@link StabilizationDetector} can call `.collect()` at the right moment.
 */
export class MetadataCollector {
  private readonly collectFn = collectMetadata;

  /** Read current metadata from the DOM. */
  collect(): CollectedMetadata {
    return this.collectFn();
  }
}
