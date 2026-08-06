export type TToolHrefCandidate = {
  key: string;
  href: string;
};

/** Flatten parent + sub-item hrefs for cross-tool most-specific selection. */
export const getToolHrefCandidates = (
  tools: Array<{ key: string; href?: string; items?: Array<{ key: string; href: string }> }>,
): TToolHrefCandidate[] =>
  tools.flatMap((tool) => [
    ...(tool.href ? [{ key: tool.key, href: tool.href }] : []),
    ...(tool.items?.map((item) => ({ key: item.key, href: item.href })) ?? []),
  ]);

const normalizePath = (path: string) =>
  path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;

// Dummy absolute base so relative hrefs/asPath can be parsed with the URL API
const HREF_PARSE_BASE = 'https://create.roblox.com';
const HREF_PARSE_HOST = 'create.roblox.com';

const parseHref = (href: string): URL => new URL(href.split('#')[0] || '/', HREF_PARSE_BASE);

const getHrefSpecificity = (href: string): { pathLength: number; queryCount: number } => {
  try {
    const url = parseHref(href);
    const path = normalizePath(url.pathname);
    return {
      // Root is the least specific match.
      pathLength: path === '/' ? 0 : path.length,
      queryCount: [...url.searchParams].length,
    };
  } catch {
    return { pathLength: 0, queryCount: 0 };
  }
};

/**
 * Whether an All Tools link should show the selected (current page) state.
 *
 * Matches pathname equality or nested prefix (`/analytics` → `/analytics/foo`).
 * Query params on the href must all be present on the current path. A bare
 * pathname (no query) does not match when the current path has query params on
 * the same pathname — so Experiences (`/dashboard/creations`) stays unselected
 * while Avatar Items (`?activeTab=HairAccessory`) is selected.
 */
const isToolHrefActive = (href: string, asPath: string): boolean => {
  try {
    const current = new URL(asPath.split('#')[0] || '/', HREF_PARSE_BASE);
    const target = parseHref(href);

    // Absolute external links are not "current page" inside Creator Hub.
    if (target.host !== HREF_PARSE_HOST && target.host !== current.host) {
      return false;
    }

    const currentPath = normalizePath(current.pathname);
    const targetPath = normalizePath(target.pathname);

    const pathMatches =
      currentPath === targetPath ||
      (targetPath !== '/' && currentPath.startsWith(`${targetPath}/`));

    if (!pathMatches) {
      return false;
    }

    for (const [key, value] of target.searchParams.entries()) {
      if (current.searchParams.get(key) !== value) {
        return false;
      }
    }

    if (
      currentPath === targetPath &&
      target.searchParams.toString() === '' &&
      current.searchParams.toString() !== ''
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Among matching parent/child links, pick the most specific: longest pathname,
 * then most query params. Ties prefer later candidates (sub-items are passed
 * after the parent) so Experiences wins over Creations when they share a href.
 * Store homepage only matches Store; `/store/models` matches Models.
 */
export const getMostSpecificActiveToolKey = (
  candidates: TToolHrefCandidate[],
  asPath: string,
): string | null => {
  let bestKey: string | null = null;
  let bestPathLength = -1;
  let bestQueryCount = -1;

  candidates.forEach(({ key, href }) => {
    if (!isToolHrefActive(href, asPath)) {
      return;
    }
    const { pathLength, queryCount } = getHrefSpecificity(href);
    if (
      pathLength > bestPathLength ||
      (pathLength === bestPathLength && queryCount >= bestQueryCount)
    ) {
      bestPathLength = pathLength;
      bestQueryCount = queryCount;
      bestKey = key;
    }
  });

  return bestKey;
};

export default isToolHrefActive;
