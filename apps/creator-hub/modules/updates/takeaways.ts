import type { TDevForumAnnouncement } from '@modules/home/utils/apiUtils';

const DEVFORUM_TOPIC_JSON_CDN_BASE = 'https://doy2mn9upadnk.cloudfront.net';
export type TakeawaysPayload = {
  content: string;
  html: string | null;
};

const isTakeawaysHeading = (text: string) => {
  const normalized = text.toLowerCase().replaceAll(/[:\s]/g, '');
  return normalized === 'keytakeaways' || normalized === 'tldr';
};

export const getOrFetchTakeaways = async ({
  announcement,
  getDevforumJsonUrl,
  sanitizeText,
  takeawaysCache,
  takeawaysInFlight,
}: {
  announcement: TDevForumAnnouncement;
  getDevforumJsonUrl: (url: string) => string;
  sanitizeText: (text: string) => string;
  takeawaysCache: Map<string, TakeawaysPayload>;
  takeawaysInFlight: Map<string, Promise<TakeawaysPayload>>;
}): Promise<TakeawaysPayload> => {
  const cacheKey = announcement.url;
  const cached = takeawaysCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const inFlight = takeawaysInFlight.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const fallback: TakeawaysPayload = {
    content: sanitizeText(announcement.excerpt ?? ''),
    html: null,
  };

  const promise = (async (): Promise<TakeawaysPayload> => {
    let cooked = '';
    try {
      if (!announcement.url) {
        return fallback;
      }

      const directUrl = getDevforumJsonUrl(announcement.url);
      const { pathname } = new URL(directUrl);
      const cdnUrl = `${DEVFORUM_TOPIC_JSON_CDN_BASE}${pathname}`;

      const getTopicJsonResponse = async (): Promise<Response> => {
        try {
          const cdnResponse = await fetch(cdnUrl);
          if (cdnResponse.ok) {
            return cdnResponse;
          }
        } catch {
          /* fall through to direct fetch */
        }
        return fetch(directUrl);
      };
      const response = await getTopicJsonResponse();
      if (!response.ok) {
        return fallback;
      }

      const data = (await response.json()) as {
        cooked?: string;
        post_stream?: { posts?: { cooked?: string }[] };
      };
      cooked = data.post_stream?.posts?.[0]?.cooked ?? data.cooked ?? '';
    } catch {
      return fallback;
    }

    if (!cooked) {
      return fallback;
    }

    const stripped = cooked
      .replaceAll(/<img[^>]*>/gi, '')
      .replaceAll(/<video[^>]*>[\s\S]*?<\/video>/gi, '')
      .replaceAll(/<source[^>]*>/gi, '')
      .replaceAll(/<div[^>]*class="video-placeholder-container"[^>]*>[\s\S]*?<\/div>/gi, '')
      .replaceAll(/<div[^>]*class="lightbox-wrapper"[^>]*>[\s\S]*?<\/div>/gi, '')
      .replaceAll(/(https?:)?\/\/devforum-uploads\.s3[.\w-]*\.amazonaws\.com[^\s"'<>]*/gi, '');
    const parsed = new DOMParser().parseFromString(stripped, 'text/html');
    const blockquote = parsed.querySelector('blockquote');
    if (!blockquote) {
      return fallback;
    }

    const blockquoteClone = blockquote.cloneNode(true) as HTMLElement;
    blockquoteClone.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
      const text = heading.textContent?.trim() || '';
      if (isTakeawaysHeading(text)) {
        heading.remove();
      }
    });

    blockquoteClone.querySelectorAll('p').forEach((paragraph) => {
      const strong = paragraph.querySelector('strong');
      const text = strong?.textContent?.trim() || '';
      if (text && isTakeawaysHeading(text)) {
        paragraph.remove();
      }
    });

    const extractedContent = sanitizeText(blockquoteClone.textContent?.trim() || '');
    const extractedHtml = blockquoteClone.innerHTML.trim() || null;

    return extractedContent ? { content: extractedContent, html: extractedHtml } : fallback;
  })();

  takeawaysInFlight.set(cacheKey, promise);
  try {
    const result = await promise;
    takeawaysCache.set(cacheKey, result);
    return result;
  } finally {
    takeawaysInFlight.delete(cacheKey);
  }
};
