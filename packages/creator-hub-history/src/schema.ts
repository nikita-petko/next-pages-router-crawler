/**
 * Zod schemas and TypeScript types for history data persisted in localStorage.
 *
 * Uses Zod for runtime validation because localStorage is an untrusted
 * boundary — data may be corrupted, outdated, or tampered with.
 * `.passthrough()` preserves unknown fields for forward compatibility.
 *
 * Invalid items are silently dropped during reads (per-item safeParse),
 * so a single corrupt entry won't discard the entire history.
 */

import { z } from 'zod';

/**
 * Label can be a plain string or a structured translation object
 * with an optional params map and fallback text.
 */
const LabelSchema = z.union([
  z.string(),
  z.object({
    translationKey: z.string(),
    translationKeyParams: z.record(z.string()).optional(),
    defaultLabel: z.string().optional(),
  }),
]);

/**
 * Author info attached to doc-site search results.
 * Uses `.passthrough()` so extra fields from the search backend
 * are preserved without schema changes.
 */
const AuthorSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
    displayName: z.string().optional(),
    hasVerifiedBadge: z.boolean().optional(),
  })
  .passthrough();

/**
 * Schema for per-page metadata stored alongside each history item.
 *
 * Each field stores the resolved value — the hub:* value when present,
 * otherwise the standard tag value. Both tiers are not stored separately.
 *
 * Uses `.passthrough()` so new fields can be added without breaking
 * existing stored data — unknown fields are preserved through validation.
 *
 * Fields are grouped by source:
 *  1. Core (required) – always present
 *  2. Shared SEO / Hub – populated from hub:* (canonical) with og:* fallback
 *  3. Hub-only – populated exclusively from hub:* custom meta tags
 *  4. SEO signals – standard meta tags for crawl behaviour
 *  5. Learn/Docs backward-compat – kept for existing doc-site items
 */
export const HistoryItemMetadataSchema = z
  .object({
    // ── Core (required) ──────────────────────────────────────────────
    /** Resolved page title (hub:title > og:title > document.title). */
    title: z.string(),
    /** Original full URL including all query params. */
    path: z.string(),

    // ── Shared SEO / Hub fields (hub:* canonical, og:* fallback) ────
    /** Page description (hub:description > og:description > meta[description]). */
    description: z.string().optional(),
    /** Site name (hub:site_name > og:site_name), e.g. "Creator Hub". */
    siteName: z.string().optional(),
    /** Page type (hub:type > og:type), e.g. "experience", "dashboard". */
    contentType: z.string().optional(),
    /** Author name (hub:author > article:author). */
    authorName: z.string().optional(),
    /** Entity name (hub:entity-name), e.g. experience name. */
    entityName: z.string().optional(),

    // ── Hub-only fields ──────────────────────────────────────────────
    /** Full breadcrumb path (hub:breadcrumb), e.g. "Settings / Notifications". */
    breadcrumb: z.string().optional(),
    /** Entity ID (hub:entity-id), interpreted via contentType. */
    entityId: z.string().optional(),
    /** User ID (hub:user-id) of the current viewer. */
    userId: z.string().optional(),

    // ── SEO signals ──────────────────────────────────────────────────
    keywords: z.string().optional(), // <meta name="keywords">

    // ── Learn/Docs backward compatibility ─────────────────────────────
    // TODO(@neoxu 2026-02-26): Clean up this section after fully migrate the doc site
    // These fields are NOT collected from the DOM. They are written
    // directly by @rbx/creator-hub-search via addToRecentlyVisited()
    // when a user clicks a search result. They store search-specific
    // display hints (icons, category labels, code-style titles, etc.).
    /** CSS class for the search result icon. */
    className: z.string().optional(),
    /** Accessible label for the search result link. */
    ariaLabel: z.string().optional(),
    /** Translated category text shown below the result title. */
    translatedCategoryDisplayText: z.string().optional(),
    /** Top-level doc content type (e.g. "tutorial", "reference"). */
    documentationContentType: z.string().nullable().optional(),
    /** Doc sub-type for finer categorisation. */
    documentationSubType: z.string().nullable().optional(),
    /** Doc third-level type (rarely used). */
    documentationThirdType: z.string().nullable().optional(),
    /** ISO-8601 creation timestamp from the doc backend. */
    createdAtUtc: z.string().optional(),
    /** ISO-8601 last-updated timestamp from the doc backend. */
    updatedAtUtc: z.string().optional(),
    /** Author info from the doc backend. */
    author: AuthorSchema.optional(),
    /** Navigation type (NavigationTypeRaw) — used for routing behaviour. */
    type: z.string().optional(),
    /** When true, the title should render in a monospace/code font. */
    isTitleCode: z.boolean().optional(),
    /** Display label — plain string or translation object. */
    label: LabelSchema.optional(),
    /** When true, hash changes on this page don't create new history entries. */
    ignoreHash: z.boolean().optional(),
  })
  .passthrough();

/** Inferred TypeScript type from HistoryItemMetadataSchema. */
export type HistoryItemMetadata = z.infer<typeof HistoryItemMetadataSchema>;

/**
 * Schema for a single history entry — combines a dedup id, a timestamp,
 * and the page metadata collected at visit time.
 */
export const HistoryItemSchema = z.object({
  /** Dedup key: pathname + kept query params (e.g. "/page?activeTab=X"). */
  id: z.string(),
  /** Millisecond timestamp of the most recent visit. */
  accessedAt: z.number(),
  /** Page metadata collected from the DOM or injected by consumers. */
  metadata: HistoryItemMetadataSchema,
});

/** Inferred TypeScript type from HistoryItemSchema. */
export type HistoryItem = z.infer<typeof HistoryItemSchema>;

/** Array schema — validates the full history list stored in localStorage. */
export const HistorySchema = z.array(HistoryItemSchema);

/** Inferred TypeScript type from HistorySchema. */
export type History = z.infer<typeof HistorySchema>;
