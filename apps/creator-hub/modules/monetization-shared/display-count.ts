/** Largest total rendered exactly; anything beyond it is shown as `999+`. */
export const MAX_DISPLAYED_COUNT = 999;

/**
 * Formats a row total for display, capping it so large catalogs don't render an exact-but-useless
 * number. Lives here so every surface reporting a row total caps identically to the table footer.
 */
export const displayTotalCount = (count: number, maxDisplayedCount = MAX_DISPLAYED_COUNT) =>
  count > maxDisplayedCount ? `${maxDisplayedCount}+` : count.toString();
