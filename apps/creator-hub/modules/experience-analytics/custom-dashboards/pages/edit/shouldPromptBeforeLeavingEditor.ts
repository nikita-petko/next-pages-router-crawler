/**
 * Pathname only — query/hash updates (draftId, breakdown, annotations,
 * filters) stay on the same editor route and must not look like a leave.
 */
function getPathname(url: string): string {
  const withoutHash = url.split('#')[0] ?? url;
  return withoutHash.split('?')[0] ?? withoutHash;
}

/**
 * Prompt only when a dirty draft is about to be abandoned. Staying in the
 * editor session — same `/edit` page, preview, or tile editor — is not a
 * leave, even when the URL query changes.
 */
export function shouldPromptBeforeLeavingEditor(
  url: string,
  dashboardId: string | undefined,
): boolean {
  if (!dashboardId) {
    return true;
  }
  const pathname = getPathname(url);
  const editorBase = `/analytics/dashboards/${dashboardId}`;
  return !(
    pathname.includes(`${editorBase}/edit`) ||
    pathname.includes(`${editorBase}/preview`) ||
    pathname.includes(`${editorBase}/tile/`)
  );
}
