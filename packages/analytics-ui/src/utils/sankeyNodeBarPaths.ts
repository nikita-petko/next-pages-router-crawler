export type SankeyNodeBarCornerMode = 'leading' | 'trailing' | 'both';

const clampRadius = (radius: number, width: number, height: number): number =>
  Math.max(0, Math.min(radius, width / 2, height / 2));

const buildRectPath = (x: number, y: number, width: number, height: number): string =>
  `M${x},${y} L${x + width},${y} L${x + width},${y + height} L${x},${y + height} Z`;

/** Rounds the leading (left) edge of a vertical stage bar. */
export const buildLeadingRoundedSankeyNodeBarPath = ({
  x,
  y,
  width,
  height,
  radius,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}): string => {
  const r = clampRadius(radius, width, height);
  if (r === 0) {
    return buildRectPath(x, y, width, height);
  }

  return [
    `M${x + r},${y}`,
    `L${x + width},${y}`,
    `L${x + width},${y + height}`,
    `L${x + r},${y + height}`,
    `Q${x},${y + height} ${x},${y + height - r}`,
    `L${x},${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    'Z',
  ].join(' ');
};

/** Rounds the trailing (right) edge of a vertical stage bar. */
export const buildTrailingRoundedSankeyNodeBarPath = ({
  x,
  y,
  width,
  height,
  radius,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}): string => {
  const r = clampRadius(radius, width, height);
  if (r === 0) {
    return buildRectPath(x, y, width, height);
  }

  return [
    `M${x},${y}`,
    `L${x + width - r},${y}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `L${x + width},${y + height - r}`,
    `Q${x + width},${y + height} ${x + width - r},${y + height}`,
    `L${x},${y + height}`,
    'Z',
  ].join(' ');
};

/** Rounds both edges of a vertical stage bar (pill shape). */
export const buildBothRoundedSankeyNodeBarPath = ({
  x,
  y,
  width,
  height,
  radius,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}): string => {
  const r = clampRadius(radius, width, height);
  if (r === 0) {
    return buildRectPath(x, y, width, height);
  }

  return [
    `M${x + r},${y}`,
    `L${x + width - r},${y}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `L${x + width},${y + height - r}`,
    `Q${x + width},${y + height} ${x + width - r},${y + height}`,
    `L${x + r},${y + height}`,
    `Q${x},${y + height} ${x},${y + height - r}`,
    `L${x},${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    'Z',
  ].join(' ');
};

export const getSankeyNodeBarCornerMode = ({
  column,
  columnCount,
}: {
  column: number;
  columnCount: number;
}): SankeyNodeBarCornerMode => {
  if (columnCount <= 1) {
    return 'both';
  }
  if (column === 0) {
    return 'leading';
  }
  if (column === columnCount - 1) {
    return 'trailing';
  }
  return 'both';
};

export const buildSankeyNodeBarPath = ({
  x,
  y,
  width,
  height,
  radius,
  cornerMode,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  cornerMode: SankeyNodeBarCornerMode;
}): string => {
  const args = { x, y, width, height, radius };
  switch (cornerMode) {
    case 'leading':
      return buildLeadingRoundedSankeyNodeBarPath(args);
    case 'trailing':
      return buildTrailingRoundedSankeyNodeBarPath(args);
    case 'both':
      return buildBothRoundedSankeyNodeBarPath(args);
    default: {
      const exhaustiveCheck: never = cornerMode;
      void exhaustiveCheck;
      return buildBothRoundedSankeyNodeBarPath(args);
    }
  }
};
