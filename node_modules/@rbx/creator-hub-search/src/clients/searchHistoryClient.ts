/**
 * Search History Client – wrapper around @rbx/creator-hub-history.
 *
 * Handles bidirectional conversion between `TSearchListItem` (search UI)
 * and `HistoryItem` (storage). Uses `cleanUrl` to split raw URLs into a
 * dedup `id` (pathname + kept query params) and the original URL for
 * navigation. Builds a display title from structured metadata fields.
 */

import {
  historyClient as sharedHistoryClient,
  cleanUrl,
  TITLE_SEPARATOR,
} from '@rbx/creator-hub-history';
import type { HistoryItem, HistoryItemMetadata } from '@rbx/creator-hub-history';
import type { TSearchListItem } from '../search/types/SearchListItem';
import type { NavigationTypeRaw } from '../utilities/pageBuild/types/NavigationRaw';
import type {
  DocumentationContentType,
  DocumentationSubType,
  DocumentationThirdType,
} from './docSiteSearchType';

/**
 * Convert the external Author type to the shape stored by HistoryItemMetadata.
 * Both types are structurally compatible — this avoids an `as any` cast.
 */
function toMetadataAuthor(
  author: TSearchListItem['author'],
): HistoryItemMetadata['author'] | undefined {
  if (!author) {
    return undefined;
  }
  return {
    id: 'id' in author ? (author.id as string | number) : undefined,
    name: author.name ?? undefined,
    displayName: author.displayName ?? undefined,
    hasVerifiedBadge:
      'hasVerifiedBadge' in author ? (author.hasVerifiedBadge as boolean) : undefined,
  };
}

function searchItemToHistoryItem(item: TSearchListItem): HistoryItem {
  const rawPath = item.ignoreHash ? item.path?.replace(/#.*$/, '') : item.path;
  const url = rawPath || '';

  const { id: dedupId } = cleanUrl({
    pathname: url.replace(/\?.*$/, ''),
    search: url.includes('?') ? `?${url.split('?')[1]}` : '',
    origin: '',
  });

  return {
    id: dedupId || item.id,
    accessedAt: typeof item.accessedAt === 'number' ? item.accessedAt : Date.now(),
    metadata: {
      title: item.title,
      path: rawPath || '',
      breadcrumb: item.hubBreadcrumb || undefined,
      className: item.className,
      ariaLabel: item.ariaLabel,
      translatedCategoryDisplayText: item.translatedCategoryDisplayText,
      documentationContentType: item.documentationContentType as string | null | undefined,
      documentationSubType: item.documentationSubType as string | null | undefined,
      documentationThirdType: item.documentationThirdType as string | null | undefined,
      createdAtUtc: item.createdAtUtc,
      updatedAtUtc: item.updatedAtUtc,
      author: toMetadataAuthor(item.author),
      description: item.description,
      type: item.type as string | undefined,
      isTitleCode: item.isTitleCode,
      label: item.label,
      ignoreHash: item.ignoreHash,
      entityId: item.entityId,
      contentType: item.hubType,
    },
  };
}

/**
 * Parse the hub:title breadcrumb path into display parts.
 *
 * hub:title may be a slash-separated breadcrumb path like
 * "Analytics / Engagement" or "Experiences / My Experiences".
 * The display title is the last segment; remaining segments form
 * the breadcrumb context shown alongside entityName.
 */
function parseBreadcrumbTitle(hubTitle: string): {
  displayTitle: string;
  hubBreadcrumb: string | undefined;
} {
  const parts = hubTitle.split(TITLE_SEPARATOR).map((s) => s.trim());
  const displayTitle = parts[parts.length - 1] || hubTitle;
  const hubBreadcrumb = hubTitle !== displayTitle ? hubTitle : undefined;
  return { displayTitle, hubBreadcrumb };
}

function historyItemToSearchItem(item: HistoryItem): TSearchListItem {
  const m = item.metadata;

  const hasBreadcrumbField = m.breadcrumb != null;
  const { displayTitle, hubBreadcrumb } = hasBreadcrumbField
    ? { displayTitle: m.title, hubBreadcrumb: m.breadcrumb }
    : parseBreadcrumbTitle(m.title);

  return {
    id: item.id,
    title: displayTitle,
    path: m.path,
    className: m.className,
    ariaLabel: m.ariaLabel,
    translatedCategoryDisplayText: m.translatedCategoryDisplayText,
    documentationContentType: m.documentationContentType as DocumentationContentType | null,
    documentationSubType: m.documentationSubType as DocumentationSubType | null,
    documentationThirdType: m.documentationThirdType as DocumentationThirdType | null,
    createdAtUtc: m.createdAtUtc,
    updatedAtUtc: m.updatedAtUtc,
    author: m.author as TSearchListItem['author'],
    description: '', // TODO(neoxu, 2026-03-16): when each page add a meaningful description, we can add it back
    type: (m.type ?? m.contentType) as NavigationTypeRaw | undefined,
    isTitleCode: m.isTitleCode,
    label: m.label,
    ignoreHash: m.ignoreHash,
    entityId: m.entityId,
    hubType: m.contentType,
    entityName: m.entityName,
    authorName: m.authorName,
    hubBreadcrumb,
  };
}

/**
 * Thin wrapper that delegates to the shared singleton `historyClient`
 * from `@rbx/creator-hub-history`. Using the singleton ensures that
 * `setActiveUser()` calls made by `HistoryProvider` are visible here,
 * so reads/writes target the correct user-scoped storage key.
 */
const searchHistoryClient = {
  /**
   * @param limit  Max items to return (defaults to the history client's configured maxItems).
   */
  async getRecentlyVisited(limit?: number): Promise<TSearchListItem[]> {
    const items = await sharedHistoryClient.getRecentlyVisited(limit);
    return items.map(historyItemToSearchItem);
  },

  async addToRecentlyVisited(item: TSearchListItem): Promise<void> {
    if (!item.path) {
      return;
    }
    const historyItem = searchItemToHistoryItem(item);
    await sharedHistoryClient.addToRecentlyVisited(historyItem);
  },

  async removeFromRecentlyVisited(itemId: TSearchListItem['id']): Promise<TSearchListItem[]> {
    await sharedHistoryClient.removeFromRecentlyVisited(itemId);
    return this.getRecentlyVisited();
  },
};

export default searchHistoryClient;
