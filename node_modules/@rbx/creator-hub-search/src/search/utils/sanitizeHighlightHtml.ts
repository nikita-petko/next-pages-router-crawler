import DOMPurify from 'dompurify';

/**
 * The only HTML the docs search backend ever emits is the highlight wrapper
 * `<strong class="query-highlight">term</strong>`. Everything else (event
 * handlers, `<img>`, `<script>`, `<iframe>`, `javascript:` URLs, etc.) is
 * stripped.
 *
 * Do not widen this list without a careful code review — these strings are
 * interpolated into the DOM via `dangerouslySetInnerHTML` and some of them
 * (titles, descriptions, creator / group names) are partially user-controlled.
 *
 * https://github.rbx.com/Roblox/creator-resources-search/blob/68365000e165a7c019c2c2d7463f9002db657c7e/services/creator-resources-search-service/src/Implementation/CreatorResourcesDocSiteSearcher.cs#L747-L748
 *
 * https://github.rbx.com/Roblox/creator-resources-search/blob/68365000e165a7c019c2c2d7463f9002db657c7e/services/creator-resources-search-service/src/Implementation/PageTemplatesVerticalSearcher.cs#L277-L278
 *
 *
 */
const ALLOWED_TAGS = ['strong'];
const ALLOWED_ATTR = ['class'];

/**
 * Sanitizes a fragment of HTML produced by the search backend so it is safe to
 * pass to `dangerouslySetInnerHTML`.
 */
export const sanitizeHighlightHtml = (input: string | null | undefined): string => {
  if (!input) {
    return '';
  }

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
};
