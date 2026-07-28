const SEGMENT_GAP_PX = 4;

export const computeVisibleRpnChipSegmentCount = ({
  segmentWidths,
  containerWidth,
  ellipsisWidth,
}: {
  segmentWidths: ReadonlyArray<number>;
  containerWidth: number;
  ellipsisWidth: number;
}): number => {
  const total = segmentWidths.length;
  if (total === 0 || containerWidth <= 0) {
    return 0;
  }

  const widthForSegments = (count: number, includeEllipsis: boolean): number => {
    if (count === 0) {
      return includeEllipsis ? ellipsisWidth : 0;
    }

    let width = segmentWidths.slice(0, count).reduce((sum, segmentWidth) => sum + segmentWidth, 0);
    width += SEGMENT_GAP_PX * Math.max(count - 1, 0);
    if (includeEllipsis && count < total) {
      width += SEGMENT_GAP_PX + ellipsisWidth;
    }
    return width;
  };

  if (widthForSegments(total, false) <= containerWidth) {
    return total;
  }

  for (let count = total - 1; count >= 1; count -= 1) {
    if (widthForSegments(count, true) <= containerWidth) {
      return count;
    }
  }

  return 0;
};
