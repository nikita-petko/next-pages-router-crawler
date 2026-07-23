// Forward-only cursor pagination for the v2 transaction-records endpoint.
//
// The transaction-records-api v2 endpoint is forward-only: it forwards an opaque `cursor` but
// never sends the enriched-ledger `previous` paging flag, so the response `previousCursor` can't
// be replayed to page backwards and `hasMore` is always forward-sense. To still support a
// "Previous" button we keep a stack of the forward cursors we've visited: the last entry is the
// current page ('' is the first page), "Next" pushes the response's nextCursor, and "Previous"
// pops back to the cursor we came from (served from the react-query cache).

// The first page has no cursor, represented by the empty string.
export const INITIAL_CURSOR_STACK: readonly string[] = [''];

// The cursor for the page currently shown (the top of the stack).
export const currentCursor = (stack: readonly string[]): string => stack[stack.length - 1] ?? '';

// A next page exists only when the response both reports more records and hands back a cursor to
// fetch them with.
export const canGoNext = (hasMore: boolean, nextCursor?: string | null): boolean =>
  hasMore && !!nextCursor;

// We can page back whenever we've advanced past the first page.
export const canGoPrevious = (stack: readonly string[]): boolean => stack.length > 1;

// Advance to the next page. A missing cursor is a no-op (the caller also gates on canGoNext).
export const pushCursor = (stack: readonly string[], nextCursor?: string | null): string[] =>
  nextCursor ? [...stack, nextCursor] : [...stack];

// Return to the previous page, never popping past the first page.
export const popCursor = (stack: readonly string[]): string[] =>
  stack.length > 1 ? stack.slice(0, -1) : [...stack];
