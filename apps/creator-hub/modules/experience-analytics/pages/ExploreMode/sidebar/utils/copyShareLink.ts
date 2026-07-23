// Copies a share-link to the user's clipboard. Defaults to the current
// page URL so the most common case ("share this view") is a no-arg call;
// callers that need to share something other than the live URL (e.g. a
// pre-rendered permalink) can pass `copyText` explicitly.
//
// Failures are intentionally swallowed and logged as a warning rather
// than thrown: the clipboard API is best-effort (browsers can deny it,
// run in non-secure contexts, etc.) and a failed copy is a soft UX
// degradation, not an error path that needs to bubble. Returning the
// success boolean lets UI callers gate "Copied!" feedback on the actual
// outcome without each one re-implementing the try/catch.
export async function copyShareLinkToClipboard(copyText?: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(copyText ?? window.location.href);
    return true;
  } catch (error) {
    console.warn('Failed to copy link to clipboard', error);
    return false;
  }
}
