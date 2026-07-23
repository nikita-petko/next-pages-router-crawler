/**
 * Client for fetching index documents used in search.
 *
 * Currently imports from a local JSON file (all.json).
 * TODO: In the future, this will fetch from CDN for better performance and freshness.
 */

// Import the static JSON file for now
// TODO: Replace with CDN fetch when available
import indexDocumentsData from './all.json';

/**
 * Represents a single index document used for search indexing.
 */
export interface IndexDocument {
  id: string;
  identifier: string;
  title: string;
  titleDynamic: string;
  summary: string;
  summaryDynamic: string;
  description: string;
  descriptionDynamic: string;
  breadcrumbs: string[];
  breadcrumbsDynamic: string[];
  subtitles: string[];
  subtitlesDynamic: string[];
  resultTargetReference: string;
  resultTargetReferenceDynamic: string;
  documentationContentType: string;
  documentationSubType: string;
  documentationThirdType: string;
  dynamicVariables: string[];
  dynamicEntities: string[];
  dynamicProperties: string[];
  tags: string[];
  labels: string[];
  locale: string;
}

/**
 * Options for fetching index documents.
 */
export interface FetchIndexDocumentsOptions {
  /**
   * Locale to filter documents by (optional).
   * If not provided, returns all documents.
   */
  locale?: string;
}

// Cache for index documents to avoid re-fetching
let cachedDocuments: IndexDocument[] | null = null;

/**
 * Fetches index documents for search indexing.
 *
 * Currently loads from a bundled JSON file.
 * In the future, this will fetch from CDN with caching.
 *
 * @param options - Optional configuration for fetching documents
 * @returns Promise resolving to an array of index documents
 *
 * @example
 * ```typescript
 * // Fetch all documents
 * const documents = await fetchIndexDocuments();
 *
 * // Fetch documents for a specific locale
 * const enDocuments = await fetchIndexDocuments({ locale: 'en-us' });
 * ```
 */
export async function fetchIndexDocuments(
  options?: FetchIndexDocumentsOptions,
): Promise<IndexDocument[]> {
  // Return cached documents if available
  if (!cachedDocuments) {
    // TODO: Replace with CDN fetch when available
    // Example future implementation:
    // const response = await fetch('https://cdn.example.com/search/index-documents.json');
    // cachedDocuments = await response.json();

    // For now, use the bundled JSON file
    cachedDocuments = indexDocumentsData as IndexDocument[];
    // TODO(@neoxu 2026-02-03): Add locale filter when CDN fetch is available
  }

  return cachedDocuments;
}

/**
 * Clears the cached index documents.
 * Useful for testing or when documents need to be refreshed.
 */
export function clearIndexDocumentsCache(): void {
  cachedDocuments = null;
}

/**
 * Checks if a document is scoped to an experience (place).
 * Experience-level documents are expanded once per experience in the search index;
 * all other documents (static or user-scoped dynamic) are added once.
 *
 * @param document - The index document to check
 * @returns true if the document is tied to an experience
 */
export function isExperiencePage(document: IndexDocument): boolean {
  const experienceIdPlacePattern = /\{experienceId\}/;
  return experienceIdPlacePattern.test(document.resultTargetReferenceDynamic ?? '');
}

export default fetchIndexDocuments;
