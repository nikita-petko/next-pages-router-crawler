import type { FC } from 'react';

export type JsonLdProps = {
  /** The structured data object. Must include `@context` and `@type`. */
  data: Record<string, unknown>;
  /** Unique key for Next.js `<Head>` deduplication. */
  id?: string;
};

/**
 * Renders a JSON-LD `<script>` tag for structured data.
 *
 * Use as a child of `<HubMeta>` or `<Head>` to inject structured data
 * into the page `<head>` for search engine indexing.
 *
 * @example
 * <HubMeta title="Overview" seoTitle="Creator Hub / Overview">
 *   <JsonLd id="creative-work" data={{ '@context': 'https://schema.org', '@type': 'CreativeWork', ... }} />
 * </HubMeta>
 */
export const JsonLd: FC<JsonLdProps> = ({ data, id }) => (
  <script
    type='application/ld+json'
    key={id}
    // eslint-disable-next-line react/no-danger -- Standard pattern for JSON-LD; JSON.stringify on our own data cannot produce executable code.
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
);
