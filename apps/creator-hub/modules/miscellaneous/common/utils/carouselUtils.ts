type TCarouselChildData = Pick<HTMLElement, 'offsetLeft' | 'offsetWidth'>;
export type TCarouselData = Pick<HTMLDivElement, 'clientWidth' | 'scrollLeft'> & {
  childrenData: Array<TCarouselChildData>;
};
type TCalculatedCarouselData = TCarouselData & { scrollRight: number };

/**
 * * NOTE(@zwang, 05/03/24): this function calculates the scroll by width if the carousel's next
 * * button is clicked. Therefore it'll always return a non-negative number
 * *
 * * To avoid the edge case where one of the children will stay clipped before/after the scroll
 * * happens, the following algorithm is used (see example below)
 * *   1. Find the child, that is currently clipped by the right edge (child8)
 * *   2. Find the child right previous to the one found in step 1 (child7)
 * *   3. Scroll to the right boundary of the child found in step 2
 * * This ensures the child found in step 1 (child8) become the leftest child in view after scroll
 * * and won't be clipped by the left edge
 * *
 * * Before scroll:
 * *
 * *              | <- leftEdge               rightEdge -> |
 * * ... | child3 | child4 | child5 | child6 | child7 | child8 | ...
 *
 * * After scroll:
 * *
 * *              | <- leftEdge               rightEdge -> |
 * * ... | child7 | child8 | child9 | child10 | child11 | child11 | ...
 */
function calculateScrollByWidthNext({
  clientWidth,
  scrollLeft,
  scrollRight,
  childrenData,
}: TCalculatedCarouselData): number {
  // * Find the child clipped by the right edge
  const childOnEdgeIndex = childrenData.findIndex(({ offsetLeft, offsetWidth }) => {
    const offsetRight = offsetLeft + offsetWidth;
    return offsetLeft <= scrollRight && offsetRight >= scrollRight;
  });

  // * Scroll a full carousel width if there is none or it's the first child
  if (childOnEdgeIndex <= 0) {
    return clientWidth;
  }

  // * Calculate the right boundary and then the scroll by width
  const { offsetLeft, offsetWidth } = childrenData[childOnEdgeIndex - 1];
  return offsetLeft + offsetWidth - scrollLeft;
}

/**
 * * NOTE(@zwang, 05/03/24): this function calculates the scroll by width if the carousel's prev
 * * button is clicked. Therefore it'll always return a non-positive number
 * *
 * * To avoid the edge case where one of the children will stay clipped before/after the scroll
 * * happens, the following algorithm is used (see example below)
 * *   1. Find the child, that is currently clipped by the left edge (child5)
 * *   2. Find the child right next to the one found in step 1 (child6)
 * *   3. Scroll to the left boundary of the child found in step 2
 * * This ensures the child found in step 1 (child5) become the rightest child in view after scroll
 * * and won't be clipped by the right edge
 * *
 * * Before scroll:
 * *
 * *         | <- leftEdge               rightEdge -> |
 * * ... | child5 | child6 | child7 | child8 | child9 | child10 | ...
 *
 * * After scroll:
 * *
 * *         | <- leftEdge               rightEdge -> |
 * * ... | child1 | child2 | child3 | child4 | child5 | child6 | ...
 */
function calculateScrollByWidthPrev({
  clientWidth,
  scrollLeft,
  scrollRight,
  childrenData,
}: TCalculatedCarouselData): number {
  // * Find the child clipped by the left edge
  const childOnEdgeIndex = childrenData.findIndex(({ offsetLeft, offsetWidth }) => {
    const offsetRight = offsetLeft + offsetWidth;
    return offsetLeft <= scrollLeft && offsetRight >= scrollLeft;
  });

  // * Scroll a full carousel width if there is none or it's the last child
  if (childOnEdgeIndex < 0 || childOnEdgeIndex === childrenData.length - 1) {
    return -clientWidth;
  }

  // * Calculate the scroll by width to the left boundary
  const { offsetLeft } = childrenData[childOnEdgeIndex + 1];
  return -(scrollRight - offsetLeft);
}

export function calculateScrollByWidth(
  { clientWidth, scrollLeft, childrenData }: TCarouselData,
  direction: 'prev' | 'next',
): number {
  const scrollRight = scrollLeft + clientWidth;
  const calculatedData = { clientWidth, scrollLeft, scrollRight, childrenData };

  // * NOTE(@zwang, 05/03/24): when the width of carousel is small enough comparing to the child
  // * width, the calculation can stuck with 0, i.e. not scrolling at all, so making sure to default
  // * to at least one carousel width
  return direction === 'prev'
    ? calculateScrollByWidthPrev(calculatedData) || -clientWidth
    : calculateScrollByWidthNext(calculatedData) || clientWidth;
}
