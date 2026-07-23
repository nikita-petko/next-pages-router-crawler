import type { SankeyLink, SankeyNode } from '../../types/SankeyChart';

/**
 * Self-contained Sankey layout.
 *
 * This is a TypeScript port of the core of d3-sankey
 * (https://github.com/d3/d3-sankey, ISC license) trimmed to the pieces this
 * package needs. It is vendored rather than taken as a dependency to keep the
 * published bundle dependency-free.
 *
 * The algorithm:
 *  1. Links each node to its incoming/outgoing links.
 *  2. Computes each node's value (max of incoming vs. outgoing flow).
 *  3. Assigns columns by longest-path depth, right-aligning sinks.
 *  4. Scales node heights to fit the available vertical space.
 *  5. Iteratively relaxes node positions to reduce link crossings, resolving
 *     collisions after each pass.
 *  6. Stacks links along each node edge and records ribbon geometry.
 */

export type LayoutNode = {
  id: string;
  name: string;
  color: string;
  /** Source node provided by the caller (for tooltip/label callbacks). */
  source: SankeyNode;
  /** Explicit node color resolved to a concrete CSS value before layout. */
  explicitColor?: string;
  /** Resolved column index (0 = left-most). */
  column: number;
  /** Flow value through the node. */
  value: number;
  /** Horizontal extent of the node bar. */
  x0: number;
  x1: number;
  /** Vertical extent of the node bar. */
  y0: number;
  y1: number;
  isFirstColumn: boolean;
  isLastColumn: boolean;
  sourceLinks: LayoutLink[];
  targetLinks: LayoutLink[];
};

export type LayoutLink = {
  id: string;
  source: LayoutNode;
  target: LayoutNode;
  value: number;
  /** Ribbon thickness in pixels. */
  width: number;
  /** Center y of the ribbon where it meets the source node. */
  sourceY: number;
  /** Center y of the ribbon where it meets the target node. */
  targetY: number;
  fractionOfSource: number;
  fractionOfTarget: number;
};

export type SankeyLayout = {
  nodes: LayoutNode[];
  links: LayoutLink[];
  columnCount: number;
  /** Width the geometry was laid out within (matches the requested width). */
  width: number;
  /**
   * Height the geometry actually occupies. This may exceed the requested height
   * when {@link SankeyLayoutOptions.minNodeThickness} forces a dense column to
   * grow taller than the requested height (the caller should size its viewBox to
   * this value and let the container scroll).
   */
  height: number;
};

export type SankeyLayoutOptions = {
  width: number;
  height: number;
  nodeWidth: number;
  nodePadding: number;
  colors: readonly string[];
  resolveColor?: (color: NonNullable<SankeyNode['color']>) => string;
  iterations?: number;
  /**
   * Minimum rendered thickness (px) of any node bar. When a column has so many
   * nodes that they cannot all meet this thickness within the requested height,
   * the layout height grows so they can. Defaults to 0 (no minimum).
   */
  minNodeThickness?: number;
  /**
   * Minimum horizontal distance (px) between adjacent columns. When the funnel
   * has enough stages that this can't be met within the requested width, the
   * layout width grows beyond it (the caller scrolls/zooms). Defaults to 0,
   * which fits all columns into the requested width.
   */
  minColumnWidth?: number;
};

const DefaultIterations = 6;
/** Tiny movement threshold used by collision resolution to avoid jitter. */
const CollisionEpsilon = 1e-6;
/** Golden-angle-ish hue step to spread generated fallback colors evenly. */
const GeneratedHueStepDegrees = 137.508;
/** Alpha decay used by the d3-sankey relaxation loop. */
const RelaxationAlphaDecay = 0.99;

const sumValues = (links: LayoutLink[]): number =>
  links.reduce((total, link) => total + link.value, 0);

const ascendingBreadth = (a: LayoutNode, b: LayoutNode): number => a.y0 - b.y0;

const reorderNodeLinks = (node: LayoutNode): void => {
  node.sourceLinks.sort((a, b) => ascendingBreadth(a.target, b.target));
  node.targetLinks.sort((a, b) => ascendingBreadth(a.source, b.source));
};

/**
 * The y of the slot for the link between `source` and `target`, measured at the
 * source node, accounting for the stacking of sibling links on both ends.
 */
const targetTop = (source: LayoutNode, target: LayoutNode, nodePadding: number): number => {
  let y = source.y0 - ((source.sourceLinks.length - 1) * nodePadding) / 2;
  for (const link of source.sourceLinks) {
    if (link.target === target) {
      break;
    }
    y += link.width + nodePadding;
  }
  for (const link of target.targetLinks) {
    if (link.source === source) {
      break;
    }
    y -= link.width;
  }
  return y;
};

const sourceTop = (source: LayoutNode, target: LayoutNode, nodePadding: number): number => {
  let y = target.y0 - ((target.targetLinks.length - 1) * nodePadding) / 2;
  for (const link of target.targetLinks) {
    if (link.source === source) {
      break;
    }
    y += link.width + nodePadding;
  }
  for (const link of source.sourceLinks) {
    if (link.target === target) {
      break;
    }
    y -= link.width;
  }
  return y;
};

const resolveCollisionsTopToBottom = (
  nodes: LayoutNode[],
  startY: number,
  startIndex: number,
  alpha: number,
  nodePadding: number,
): void => {
  let y = startY;
  for (let i = startIndex; i < nodes.length; ++i) {
    const node = nodes[i];
    const dy = (y - node.y0) * alpha;
    if (dy > CollisionEpsilon) {
      node.y0 += dy;
      node.y1 += dy;
    }
    y = node.y1 + nodePadding;
  }
};

const resolveCollisionsBottomToTop = (
  nodes: LayoutNode[],
  startY: number,
  startIndex: number,
  alpha: number,
  nodePadding: number,
): void => {
  let y = startY;
  for (let i = startIndex; i >= 0; --i) {
    const node = nodes[i];
    const dy = (node.y1 - y) * alpha;
    if (dy > CollisionEpsilon) {
      node.y0 -= dy;
      node.y1 -= dy;
    }
    y = node.y0 - nodePadding;
  }
};

const resolveCollisions = (
  nodes: LayoutNode[],
  alpha: number,
  y0: number,
  y1: number,
  nodePadding: number,
): void => {
  if (nodes.length === 0) {
    return;
  }
  const i = nodes.length >> 1;
  const subject = nodes[i];
  resolveCollisionsBottomToTop(nodes, subject.y0 - nodePadding, i - 1, alpha, nodePadding);
  resolveCollisionsTopToBottom(nodes, subject.y1 + nodePadding, i + 1, alpha, nodePadding);
  resolveCollisionsBottomToTop(nodes, y1, nodes.length - 1, alpha, nodePadding);
  resolveCollisionsTopToBottom(nodes, y0, 0, alpha, nodePadding);
};

/**
 * Assign each node a column. Honors an explicit `column` on the input node;
 * otherwise uses longest-path depth from sources and right-aligns sinks.
 */
const computeColumns = (nodes: LayoutNode[]): number => {
  const nodeCount = nodes.length;

  // depth = longest path from any source node.
  let current = new Set(nodes);
  let next = new Set<LayoutNode>();
  let depth = 0;
  const depthById = new Map<LayoutNode, number>();
  while (current.size) {
    for (const node of current) {
      depthById.set(node, depth);
      for (const link of node.sourceLinks) {
        next.add(link.target);
      }
    }
    if (++depth > nodeCount) {
      throw new Error('Sankey layout: circular link detected');
    }
    current = next;
    next = new Set();
  }

  const maxDepth = Math.max(0, ...Array.from(depthById.values()));

  for (const node of nodes) {
    if (node.source.column !== undefined) {
      node.column = Math.max(0, Math.floor(node.source.column));
      continue;
    }
    const nodeDepth = depthById.get(node) ?? 0;
    // Right-align sinks (no outgoing links) to the final column.
    node.column = node.sourceLinks.length === 0 ? maxDepth : nodeDepth;
  }

  return Math.max(0, ...nodes.map((node) => node.column)) + 1;
};

const groupByColumn = (nodes: LayoutNode[], columnCount: number): LayoutNode[][] => {
  const columns: LayoutNode[][] = Array.from({ length: columnCount }, () => []);
  for (const node of nodes) {
    columns[node.column].push(node);
  }
  return columns;
};

/** True when this node is allowed to originate flow (stage 0 only). */
const isStage0Entry = (node: LayoutNode): boolean =>
  (node.source.column !== undefined && node.source.column <= 0) ||
  (node.source.column === undefined && node.targetLinks.length === 0);

/**
 * Removes nodes and links that are not downstream of a stage-0 entry. Flow may
 * only originate from column-0 nodes (explicit) or from inferred sources with no
 * incoming links when `column` is omitted.
 */
const pruneToStage0Origins = (
  nodes: LayoutNode[],
  links: LayoutLink[],
): { nodes: LayoutNode[]; links: LayoutLink[] } => {
  const entryNodes = nodes.filter(isStage0Entry);
  if (entryNodes.length === 0) {
    throw new Error(
      'Sankey layout: at least one stage-0 entry node is required (column 0, or a source with no incoming links)',
    );
  }

  const reachable = new Set<LayoutNode>(entryNodes);
  const pending = [...entryNodes];
  while (pending.length > 0) {
    const node = pending.pop();
    if (!node) {
      break;
    }
    for (const link of node.sourceLinks) {
      if (!reachable.has(link.target)) {
        reachable.add(link.target);
        pending.push(link.target);
      }
    }
  }

  const prunedNodes = nodes.filter((node) => reachable.has(node));
  const prunedLinks = links.filter(
    (link) => reachable.has(link.source) && reachable.has(link.target),
  );
  const prunedLinkSet = new Set(prunedLinks);

  for (const node of prunedNodes) {
    node.sourceLinks = node.sourceLinks.filter((link) => prunedLinkSet.has(link));
    node.targetLinks = node.targetLinks.filter((link) => prunedLinkSet.has(link));
  }

  return { nodes: prunedNodes, links: prunedLinks };
};

/**
 * Assigns bar colors left-to-right across stages. Each node gets the next palette
 * entry so colors never repeat from an earlier stage; nodes within a stage stay
 * distinct. Explicit {@link SankeyNode.color} values are preserved after the
 * renderer resolves them to CSS values. When the palette is exhausted,
 * additional hues are generated.
 */
const assignColumnColors = (columns: LayoutNode[][], colors: readonly string[]): void => {
  const fallback = colors[0] ?? '#5776e5';
  let paletteIndex = 0;
  for (const column of columns) {
    for (const node of column) {
      if (node.explicitColor) {
        node.color = node.explicitColor;
        continue;
      }
      if (paletteIndex < colors.length) {
        node.color = colors[paletteIndex] ?? fallback;
      } else {
        const hue = (paletteIndex * GeneratedHueStepDegrees) % 360;
        node.color = `hsl(${hue} 60% 55%)`;
      }
      paletteIndex += 1;
    }
  }
};

/**
 * Computes a Sankey layout for the given nodes and links.
 *
 * The returned nodes/links carry absolute pixel geometry ready to render into
 * an SVG of the requested `width` x `height`.
 */
export const computeSankeyLayout = (
  inputNodes: SankeyNode[],
  inputLinks: SankeyLink[],
  options: SankeyLayoutOptions,
): SankeyLayout => {
  const {
    width: requestedWidth,
    height: requestedHeight,
    nodeWidth,
    nodePadding,
    colors,
    resolveColor,
    iterations = DefaultIterations,
    minNodeThickness = 0,
    minColumnWidth = 0,
  } = options;

  const nodeById = new Map<string, LayoutNode>();
  const nodes: LayoutNode[] = inputNodes.map((source) => {
    const explicitColor = source.color && resolveColor ? resolveColor(source.color) : undefined;
    const node: LayoutNode = {
      id: source.id,
      name: source.name,
      color: explicitColor ?? colors[0] ?? '#5776e5',
      source,
      explicitColor,
      column: 0,
      value: 0,
      x0: 0,
      x1: 0,
      y0: 0,
      y1: 0,
      isFirstColumn: false,
      isLastColumn: false,
      sourceLinks: [],
      targetLinks: [],
    };
    nodeById.set(node.id, node);
    return node;
  });

  const links: LayoutLink[] = [];
  inputLinks.forEach((input, index) => {
    const source = nodeById.get(input.source);
    const target = nodeById.get(input.target);
    if (!source || !target || !(input.value > 0)) {
      return;
    }
    const link: LayoutLink = {
      id: `sankey-link-${index}`,
      source,
      target,
      value: input.value,
      width: 0,
      sourceY: 0,
      targetY: 0,
      fractionOfSource: 0,
      fractionOfTarget: 0,
    };
    source.sourceLinks.push(link);
    target.targetLinks.push(link);
    links.push(link);
  });

  const pruned = pruneToStage0Origins(nodes, links);
  const activeNodes = pruned.nodes;
  const activeLinks = pruned.links;

  // Node value = max of incoming and outgoing flow.
  for (const node of activeNodes) {
    node.value = Math.max(sumValues(node.sourceLinks), sumValues(node.targetLinks));
  }

  // Per-link fractions for tooltips.
  for (const link of activeLinks) {
    const sourceOut = sumValues(link.source.sourceLinks);
    const targetIn = sumValues(link.target.targetLinks);
    link.fractionOfSource = sourceOut > 0 ? link.value / sourceOut : 0;
    link.fractionOfTarget = targetIn > 0 ? link.value / targetIn : 0;
  }

  const columnCount = computeColumns(activeNodes);
  const columns = groupByColumn(activeNodes, columnCount);
  assignColumnColors(columns, colors);
  const lastColumn = columnCount - 1;

  // Grow the layout height if any column has too many nodes to honor the
  // minimum node thickness within the requested height. The container scrolls
  // the overflow; zoom is applied separately by the renderer.
  const minNeededHeight = Math.max(
    requestedHeight,
    ...columns.map((column) =>
      column.length > 0 ? column.length * minNodeThickness + (column.length - 1) * nodePadding : 0,
    ),
  );
  const height = minNeededHeight;

  // Grow the layout width if the funnel has too many stages to honor the
  // minimum column spacing within the requested width. The container scrolls
  // the overflow horizontally; the renderer zooms separately.
  const width = Math.max(requestedWidth, lastColumn * minColumnWidth + nodeWidth);

  // Horizontal placement of node bars.
  const kx = lastColumn > 0 ? (width - nodeWidth) / lastColumn : 0;
  for (const node of activeNodes) {
    node.x0 = node.column * kx;
    node.x1 = node.x0 + nodeWidth;
    node.isFirstColumn = node.column === 0;
    node.isLastColumn = node.column === lastColumn;
  }

  // Vertical scale: choose a single value->pixel scale so columns are comparable.
  const padding = Math.min(
    nodePadding,
    height / Math.max(1, Math.max(...columns.map((c) => c.length)) - 1),
  );
  const ky = Math.min(
    ...columns
      .filter((column) => column.length > 0)
      .map((column) => {
        const totalValue = column.reduce((total, node) => total + node.value, 0);
        if (totalValue <= 0) {
          return Number.POSITIVE_INFINITY;
        }
        return (height - (column.length - 1) * padding) / totalValue;
      }),
  );
  const scale = Number.isFinite(ky) && ky > 0 ? ky : 1;

  // Initialize node breadths (vertical positions) and link widths.
  for (const column of columns) {
    let y = 0;
    for (const node of column) {
      node.y0 = y;
      node.y1 = y + Math.max(node.value * scale, minNodeThickness);
      y = node.y1 + padding;
      for (const link of node.sourceLinks) {
        link.width = link.value * scale;
      }
    }
    // Center the column vertically within the available height.
    const leftover = (height - y + padding) / (column.length + 1);
    column.forEach((node, index) => {
      const shift = leftover * (index + 1);
      node.y0 += shift;
      node.y1 += shift;
    });
    column.forEach(reorderNodeLinks);
  }

  // Relaxation passes to reduce crossings.
  for (let iteration = 0; iteration < iterations; ++iteration) {
    const alpha = RelaxationAlphaDecay ** iteration;
    const beta = Math.max(1 - alpha, (iteration + 1) / iterations);

    // Right to left.
    for (let i = columns.length - 2; i >= 0; --i) {
      const column = columns[i];
      for (const source of column) {
        let weightedY = 0;
        let weight = 0;
        for (const link of source.sourceLinks) {
          const v = link.value * (link.target.column - source.column);
          weightedY += sourceTop(source, link.target, padding) * v;
          weight += v;
        }
        if (!(weight > 0)) {
          continue;
        }
        const dy = (weightedY / weight - source.y0) * alpha;
        source.y0 += dy;
        source.y1 += dy;
        reorderNodeLinks(source);
      }
      column.sort(ascendingBreadth);
      resolveCollisions(column, beta, 0, height, padding);
    }

    // Left to right.
    for (let i = 1; i < columns.length; ++i) {
      const column = columns[i];
      for (const target of column) {
        let weightedY = 0;
        let weight = 0;
        for (const link of target.targetLinks) {
          const v = link.value * (target.column - link.source.column);
          weightedY += targetTop(link.source, target, padding) * v;
          weight += v;
        }
        if (!(weight > 0)) {
          continue;
        }
        const dy = (weightedY / weight - target.y0) * alpha;
        target.y0 += dy;
        target.y1 += dy;
        reorderNodeLinks(target);
      }
      column.sort(ascendingBreadth);
      resolveCollisions(column, beta, 0, height, padding);
    }
  }

  // Stack links along each node edge and record ribbon center positions.
  for (const node of activeNodes) {
    let sourceEdgeY = node.y0;
    for (const link of node.sourceLinks) {
      link.sourceY = sourceEdgeY + link.width / 2;
      sourceEdgeY += link.width;
    }
    let targetEdgeY = node.y0;
    for (const link of node.targetLinks) {
      link.targetY = targetEdgeY + link.width / 2;
      targetEdgeY += link.width;
    }
  }

  return { nodes: activeNodes, links: activeLinks, columnCount, width, height };
};

/**
 * Builds the SVG path `d` for a Sankey link ribbon between two nodes.
 *
 * @param overlap How far (px) each ribbon end extends *into* the adjacent node
 *   bar. The renderer draws links before nodes so this tuck sits underneath the
 *   pill-shaped node fill, giving a seamless join at rounded ends. Should match
 *   the node corner radius.
 */
export const buildLinkRibbonPath = (link: LayoutLink, overlap = 0): string => {
  const x0 = link.source.x1 - overlap;
  const x1 = link.target.x0 + overlap;
  const halfWidth = link.width / 2;
  const topStart = link.sourceY - halfWidth;
  const topEnd = link.targetY - halfWidth;
  const bottomStart = link.sourceY + halfWidth;
  const bottomEnd = link.targetY + halfWidth;
  const xMid = (x0 + x1) / 2;

  return [
    `M${x0},${topStart}`,
    `C${xMid},${topStart} ${xMid},${topEnd} ${x1},${topEnd}`,
    `L${x1},${bottomEnd}`,
    `C${xMid},${bottomEnd} ${xMid},${bottomStart} ${x0},${bottomStart}`,
    'Z',
  ].join('');
};

/** Builds the SVG path `d` for a node bar with both ends rounded (pill shape). */
export const buildNodeBarPath = (node: LayoutNode, radius: number): string => {
  const { x0, x1, y0, y1 } = node;
  const barWidth = x1 - x0;
  const height = y1 - y0;
  const r = Math.max(0, Math.min(radius, barWidth / 2, height / 2));

  if (r === 0) {
    return `M${x0},${y0} L${x1},${y0} L${x1},${y1} L${x0},${y1} Z`;
  }

  return [
    `M${x0 + r},${y0}`,
    `L${x1 - r},${y0}`,
    `Q${x1},${y0} ${x1},${y0 + r}`,
    `L${x1},${y1 - r}`,
    `Q${x1},${y1} ${x1 - r},${y1}`,
    `L${x0 + r},${y1}`,
    `Q${x0},${y1} ${x0},${y1 - r}`,
    `L${x0},${y0 + r}`,
    `Q${x0},${y0} ${x0 + r},${y0}`,
    'Z',
  ].join('');
};
