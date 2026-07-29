import type { SankeyLink, SankeyNode } from '../types/SankeyChart';

export type SankeyContentSize = {
  /** Diagram width at zoom 1 (may exceed the measured container width). */
  contentWidth: number;
  /** Diagram height at zoom 1 (may exceed the requested height). */
  contentHeight: number;
  /** Zero-based index of the rightmost column. */
  lastColumnIndex: number;
  /** Node count in the densest column. */
  maxColumnCount: number;
};

/**
 * Diagram width used before the container reports a measurement. Matches the
 * narrowest analytics card the chart ships in, so the first paint is close to
 * the measured layout and the swap is not visible.
 */
const FallbackDiagramWidth = 600;

type ComputeSankeyContentSizeParams = {
  nodes: SankeyNode[];
  links: SankeyLink[];
  measuredWidth: number;
  height: number;
  nodeWidth: number;
  nodePadding: number;
  minNodeThickness: number;
  minColumnWidth: number;
};

/**
 * Derives the Highcharts stage size so dense funnels honor minimum bar
 * thickness and stage spacing by growing the canvas (scroll/zoom) rather than
 * collapsing geometry — the same contract as the previous custom layout.
 */
export const computeSankeyContentSize = ({
  nodes,
  links,
  measuredWidth,
  height,
  nodeWidth,
  nodePadding,
  minNodeThickness,
  minColumnWidth,
}: ComputeSankeyContentSizeParams): SankeyContentSize => {
  const columnCounts = new Map<number, number>();
  let lastColumnIndex = 0;

  for (const node of nodes) {
    if (node.column === undefined) {
      continue;
    }
    lastColumnIndex = Math.max(lastColumnIndex, node.column);
    columnCounts.set(node.column, (columnCounts.get(node.column) ?? 0) + 1);
  }

  // When columns are omitted, Highcharts derives them from topology. Approximate
  // depth from longest source→target chain so minColumnWidth still has effect.
  if (columnCounts.size === 0 && links.length > 0) {
    const outgoing = new Map<string, string[]>();
    for (const link of links) {
      const targets = outgoing.get(link.source) ?? [];
      targets.push(link.target);
      outgoing.set(link.source, targets);
    }
    const depthMemo = new Map<string, number>();
    const depthOf = (id: string, stack: Set<string>): number => {
      const cached = depthMemo.get(id);
      if (cached !== undefined) {
        return cached;
      }
      if (stack.has(id)) {
        return 0;
      }
      stack.add(id);
      const targets = outgoing.get(id) ?? [];
      const depth =
        targets.length === 0 ? 0 : 1 + Math.max(...targets.map((target) => depthOf(target, stack)));
      stack.delete(id);
      depthMemo.set(id, depth);
      return depth;
    };
    for (const node of nodes) {
      lastColumnIndex = Math.max(lastColumnIndex, depthOf(node.id, new Set()));
    }
    // Without explicit columns we cannot know densest-column cardinality; keep
    // height at the requested value unless min thickness is unused.
  }

  let maxColumnCount = 0;
  for (const count of columnCounts.values()) {
    maxColumnCount = Math.max(maxColumnCount, count);
  }

  const minHeightForThickness =
    maxColumnCount > 0 && minNodeThickness > 0
      ? maxColumnCount * minNodeThickness + (maxColumnCount - 1) * nodePadding
      : 0;

  const minWidthForColumns =
    lastColumnIndex > 0 && minColumnWidth > 0 ? lastColumnIndex * minColumnWidth + nodeWidth : 0;

  const fallbackWidth = measuredWidth > 0 ? measuredWidth : FallbackDiagramWidth;

  return {
    contentWidth: Math.max(fallbackWidth, minWidthForColumns),
    contentHeight: Math.max(height, minHeightForThickness),
    lastColumnIndex,
    maxColumnCount,
  };
};
