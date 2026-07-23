import React from 'react';
import type { FC, ReactNode } from 'react';
import Head from 'next/head';
import { HUB_META_PREFIX, SiteName } from '../config';
import buildBreadcrumb from '../utils/buildBreadcrumb';

/**
 * A single level in a breadcrumb trail.
 *
 * Used by {@link HubMetaProps.breadcrumbItems} to emit both:
 * - `hub:breadcrumb` meta tag for Hub Search (auto-derived from `name` fields)
 * - `BreadcrumbList` JSON-LD for Google rich snippets (uses both `name` and `url`)
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
 */
export type BreadcrumbItem = {
  /** Display name shown in the breadcrumb trail (e.g. "Licenses"). */
  name: string;
  /** Fully-qualified URL for this breadcrumb level (e.g. "https://create.roblox.com/explore/licenses"). */
  url: string;
};

/**
 * Fallback chains (most specific wins):
 *
 *   hub:title        ← title
 *   <title>          ← seoTitle       → title
 *   og:title         ← ogTitle        → seoTitle  → title
 *
 *   hub:description  ← description
 *   meta[description]← seoDescription → description
 *   og:description   ← ogDescription  → seoDescription → description
 *
 * In practice `ogTitle` / `ogDescription` are rarely needed — Creator Hub is
 * a SaaS app behind authentication so pages are not shared on social platforms.
 * They exist for edge cases (e.g. public landing pages) and to override the
 * app-level default set by PageHead.
 *
 * When `hubOnly` is true, only `hub:*` tags are emitted. Standard SEO tags
 * (`<title>`, `og:*`, `meta[description]`, etc.) are skipped. Use this when
 * another component (e.g. AppBreadcrumbs, CreatorHubLayoutContainer) already sets
 * the SEO tags and you only need to enrich hub-specific metadata for
 * recently-visited / hub search.
 */
export type HubMetaProps = {
  /**
   * When true, only emit `hub:*` tags. Standard SEO / OG tags are skipped.
   * Use when SEO tags are already set by another component and you only need
   * to enrich hub metadata (e.g. entity-name, entity-id, type).
   */
  hubOnly?: boolean;
  /** Hub display title (hub search & recently visited). Also feeds `<title>` and `og:title` unless overridden or `hubOnly`. */
  title?: string;
  /** Browser `<title>` override. Falls back to `title`. Also feeds `og:title` unless `ogTitle` is set. Ignored when `hubOnly`. */
  seoTitle?: string;
  /** `og:title` override. Falls back to `seoTitle` → `title`. Ignored when `hubOnly`. */
  ogTitle?: string;
  /** Hub display description. Also feeds `meta[description]` and `og:description` unless overridden or `hubOnly`. */
  description?: string;
  /** `<meta name="description">` override. Falls back to `description`. Ignored when `hubOnly`. */
  seoDescription?: string;
  /** `og:description` override. Falls back to `seoDescription` → `description`. Ignored when `hubOnly`. */
  ogDescription?: string;
  /** Author name. Also used for `article:author` unless `seoAuthor` is set. */
  author?: string;
  /** SEO author override for `article:author`. Ignored when `hubOnly`. */
  seoAuthor?: string;
  /** Site name for `og:site_name` and `hub:site_name`. Defaults to `SiteName.CreatorHub`. When `hubOnly`, only emits `hub:site_name`. */
  siteName?: SiteName;
  /** Comma-separated keywords for `meta[keywords]`. Ignored when `hubOnly`. */
  keywords?: string;
  /** Crawl directives for `meta[robots]`. Ignored when `hubOnly`. */
  robots?: string;
  /** Open Graph image URL for `og:image`. Ignored when `hubOnly`. */
  ogImage?: string;
  /** Open Graph page URL for `og:url`. Ignored when `hubOnly`. */
  ogUrl?: string;
  /** Open Graph content type for `og:type` (e.g. `"website"`, `"article"`). Ignored when `hubOnly`. */
  ogType?: string;
  /** Canonical URL for `<link rel="canonical">`. Ignored when `hubOnly`. */
  canonical?: string;
  /** Page classification for `hub:type` (e.g. `"experience"`, `"dashboard"`). Hub-only. */
  type?: string;
  /** Entity name for `hub:entity-name` (e.g. experience name). Hub-only. */
  entityName?: string;
  /** Entity ID for `hub:entity-id` (interpreted via `type`). Hub-only. */
  entityId?: string;
  /** User ID for `hub:user-id`. Hub-only. */
  userId?: string;
  /** Display label for `hub:label` — plain string or JSON translation object. Hub-only. */
  label?: string;
  /**
   * Plain breadcrumb string for `hub:breadcrumb` (e.g. "Settings / Notifications").
   *
   * Use with `buildBreadcrumb()` when you only need Hub Search breadcrumbs
   * and don't need SEO JSON-LD.
   *
   * If `breadcrumbItems` is also provided, it takes precedence (auto-derives
   * the string from item names).
   *
   * @example
   * breadcrumb={buildBreadcrumb(translate('Heading.Creations'), translate('Heading.CreateAsset'))}
   */
  breadcrumb?: string;
  /**
   * Structured breadcrumb trail for SEO and Hub Search.
   *
   * When provided, this prop emits:
   * 1. `BreadcrumbList` JSON-LD — schema.org structured data that Google uses
   *    to display breadcrumb trails in search results (ignored when `hubOnly`)
   * 2. `hub:breadcrumb` meta tag — auto-derived by joining item names with `" / "`,
   *    **unless** the explicit `breadcrumb` string prop is also provided (which takes
   *    priority, same pattern as `seoTitle` vs `title`)
   *
   * Use this when your page needs SEO breadcrumbs (i.e. public-facing pages that
   * should appear in Google with breadcrumb trails). If you also need a different
   * breadcrumb string for Hub Search, provide both `breadcrumbItems` and `breadcrumb`.
   *
   * Items are ordered top-level first.
   *
   * @example
   * // Use case 1: breadcrumbItems only — derives hub:breadcrumb + emits JSON-LD
   * breadcrumbItems={[
   *   { name: 'Licenses', url: 'https://create.roblox.com/explore/licenses' },
   *   { name: 'Polly Pocket', url: 'https://create.roblox.com/explore/licenses/abc-123' },
   * ]}
   * // hub:breadcrumb = "Licenses / Polly Pocket"
   *
   * @example
   * // Use case 2: both — breadcrumb wins for Hub Search, breadcrumbItems for Google
   * breadcrumb="IP Listings / Polly Pocket"
   * breadcrumbItems={[
   *   { name: 'Licenses', url: 'https://create.roblox.com/explore/licenses' },
   *   { name: 'Polly Pocket', url: 'https://create.roblox.com/explore/licenses/abc-123' },
   * ]}
   * // hub:breadcrumb = "IP Listings / Polly Pocket" (explicit string wins)
   *
   * @see https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
   */
  breadcrumbItems?: BreadcrumbItem[];
  /** When true, emits `hub:is-title-code` = "true" so the title renders in monospace. Hub-only. */
  isTitleCode?: boolean;
  /**
   * Extra `<Head>` children for tags not covered by HubMeta props.
   *
   * Use for page-specific structured data (e.g. `CreativeWork`, `ItemList` JSON-LD)
   * that doesn't have a fixed shape across pages. Pass a `<script type="application/ld+json">`
   * tag or use a helper component that renders one.
   */
  children?: ReactNode;
};

/**
 * Sets per-page metadata for both SEO (standard tags) and Hub features
 * (hub:* tags). Both tiers are always emitted — they share the same value
 * unless a `seo*` prop is provided.
 *
 * When `hubOnly` is true, only `hub:*` tags are emitted. Use this when
 * SEO tags are already set by another component (e.g. layout, breadcrumbs).
 *
 * For app-level defaults (icons, viewport, theme-color), use PageHead.
 */
export const HubMeta: FC<HubMetaProps> = React.memo(
  ({
    hubOnly = false,
    title,
    seoTitle,
    ogTitle,
    description,
    seoDescription,
    ogDescription,
    author,
    seoAuthor,
    siteName = SiteName.CreatorHub,
    keywords,
    robots,
    ogImage,
    ogUrl,
    ogType,
    canonical,
    type,
    entityName,
    entityId,
    userId,
    label,
    breadcrumb,
    breadcrumbItems,
    isTitleCode,
    children,
  }) => {
    const emitSeoTags = <T,>(value: T | undefined): T | undefined => (hubOnly ? undefined : value);

    const effectiveBrowserTitle = emitSeoTags(seoTitle ?? title);
    const effectiveOgTitle = emitSeoTags(ogTitle ?? seoTitle ?? title);
    const effectiveBrowserDescription = emitSeoTags(seoDescription ?? description);
    const effectiveOgDescription = emitSeoTags(ogDescription ?? seoDescription ?? description);
    const effectiveSeoAuthor = emitSeoTags(seoAuthor ?? author);

    // Explicit breadcrumb string wins for hub:breadcrumb (same pattern as seoTitle vs title —
    // you may want Hub Search to display a different breadcrumb than Google).
    // Falls back to deriving from breadcrumbItems if no explicit string is provided.
    const effectiveBreadcrumb =
      breadcrumb ??
      (breadcrumbItems && breadcrumbItems.length > 0
        ? buildBreadcrumb(...breadcrumbItems.map((item) => item.name))
        : undefined);

    return (
      <Head>
        {/* ── Title ──────────────────────────────────────────────────────── */}
        {effectiveBrowserTitle && <title>{effectiveBrowserTitle}</title>}
        {effectiveOgTitle && <meta property='og:title' content={effectiveOgTitle} key='og:title' />}
        {title && (
          <meta name={`${HUB_META_PREFIX}title`} content={title} key={`${HUB_META_PREFIX}title`} />
        )}

        {/* ── Description ────────────────────────────────────────────────── */}
        {effectiveOgDescription && (
          <meta property='og:description' content={effectiveOgDescription} key='og:description' />
        )}
        {effectiveBrowserDescription && (
          <meta name='description' content={effectiveBrowserDescription} key='description' />
        )}
        {description && (
          <meta
            name={`${HUB_META_PREFIX}description`}
            content={description}
            key={`${HUB_META_PREFIX}description`}
          />
        )}

        {/* ── Author ─────────────────────────────────────────────────────── */}
        {effectiveSeoAuthor && (
          <meta property='article:author' content={effectiveSeoAuthor} key='article:author' />
        )}
        {author && (
          <meta
            name={`${HUB_META_PREFIX}author`}
            content={author}
            key={`${HUB_META_PREFIX}author`}
          />
        )}

        {/* ── Site name ──────────────────────────────────────────────────── */}
        {!hubOnly && <meta property='og:site_name' content={siteName} key='og:site_name' />}
        <meta
          name={`${HUB_META_PREFIX}site_name`}
          content={siteName}
          key={`${HUB_META_PREFIX}site_name`}
        />

        {/* ── SEO signals (skipped in hubOnly mode) ─────────────────────── */}
        {!hubOnly && keywords && <meta name='keywords' content={keywords} key='keywords' />}
        {!hubOnly && robots && <meta name='robots' content={robots} key='robots' />}
        {!hubOnly && ogImage && <meta property='og:image' content={ogImage} key='og:image' />}
        {!hubOnly && ogUrl && <meta property='og:url' content={ogUrl} key='og:url' />}
        {!hubOnly && ogType && <meta property='og:type' content={ogType} key='og:type' />}
        {!hubOnly && canonical && <link rel='canonical' href={canonical} />}

        {/* ── Hub-only fields ────────────────────────────────────────────── */}
        {type && (
          <meta name={`${HUB_META_PREFIX}type`} content={type} key={`${HUB_META_PREFIX}type`} />
        )}
        {entityName && (
          <meta
            name={`${HUB_META_PREFIX}entity-name`}
            content={entityName}
            key={`${HUB_META_PREFIX}entity-name`}
          />
        )}
        {entityId && (
          <meta
            name={`${HUB_META_PREFIX}entity-id`}
            content={entityId}
            key={`${HUB_META_PREFIX}entity-id`}
          />
        )}
        {userId && (
          <meta
            name={`${HUB_META_PREFIX}user-id`}
            content={userId}
            key={`${HUB_META_PREFIX}user-id`}
          />
        )}
        {label && (
          <meta name={`${HUB_META_PREFIX}label`} content={label} key={`${HUB_META_PREFIX}label`} />
        )}
        {effectiveBreadcrumb && (
          <meta
            name={`${HUB_META_PREFIX}breadcrumb`}
            content={effectiveBreadcrumb}
            key={`${HUB_META_PREFIX}breadcrumb`}
          />
        )}
        {isTitleCode && (
          <meta
            name={`${HUB_META_PREFIX}is-title-code`}
            content='true'
            key={`${HUB_META_PREFIX}is-title-code`}
          />
        )}

        {/* ── Structured data (JSON-LD) ──────────────────────────────── */}
        {/* BreadcrumbList — derived from breadcrumbItems; helps Google display
            breadcrumb trails directly in search results */}
        {!hubOnly && breadcrumbItems && breadcrumbItems.length > 0 && (
          <script
            type='application/ld+json'
            key='breadcrumb-jsonld'
            // eslint-disable-next-line react/no-danger -- Standard pattern for JSON-LD; JSON.stringify on our own data cannot produce executable code.
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: breadcrumbItems.map((item, index) => ({
                  '@type': 'ListItem',
                  position: index + 1,
                  name: item.name,
                  item: item.url,
                })),
              }),
            }}
          />
        )}

        {children}
      </Head>
    );
  },
);
HubMeta.displayName = 'HubMeta';
