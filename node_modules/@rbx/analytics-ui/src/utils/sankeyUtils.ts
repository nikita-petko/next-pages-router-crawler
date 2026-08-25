import type { SeriesSankeyNodesOptionsObject } from 'highcharts';
import type { TTheme } from '@rbx/ui';
import type { ChartColor } from '../color';
import { getChartColorHexString } from '../color';
import type { SankeyNode } from '../types/SankeyChart';

/**
 * Remaps {@link SankeyNode.column} onto a dense zero-based sequence, preserving
 * stage order, so callers can pass domain stage numbers straight through.
 * A gap leaves an empty Highcharts column, whose translation factor of 0 wins
 * across the series and collapses every bar and ribbon to zero size.
 */
export const densifySankeyNodeColumns = (nodes: SankeyNode[]): SankeyNode[] => {
  const columns = Array.from(
    new Set(nodes.map((node) => node.column).filter((column) => column !== undefined)),
  ).sort((a, b) => a - b);

  if (columns.every((column, index) => column === index)) {
    return nodes;
  }

  const denseColumnByColumn = new Map(columns.map((column, index) => [column, index]));
  return nodes.map((node) =>
    node.column === undefined
      ? node
      : { ...node, column: denseColumnByColumn.get(node.column) ?? node.column },
  );
};

/**
 * Maps package-level Sankey nodes to Highcharts node options, assigning palette
 * colors when a node does not specify an explicit {@link SankeyNode.color}.
 *
 * When {@link SankeyNode.column} is set, also anchors the label to the outer
 * side of its stage: the first stage reads rightward, the final stage leftward.
 */
export const buildSankeyNodes = ({
  nodes,
  colors,
  theme,
}: {
  nodes: SankeyNode[];
  colors: readonly ChartColor[];
  theme: TTheme;
}): SeriesSankeyNodesOptionsObject[] => {
  let autoColorIndex = 0;
  const maxColumn = nodes.reduce(
    (max, node) => (node.column === undefined ? max : Math.max(max, node.column)),
    0,
  );

  return nodes.map((node) => {
    const paletteColor = colors[autoColorIndex++ % colors.length] ?? colors[0];
    const resolvedColor = node.color
      ? getChartColorHexString(node.color, theme)
      : paletteColor
        ? getChartColorHexString(paletteColor, theme)
        : undefined;

    const isFirstColumn = node.column === 0;
    const isLastColumn = node.column !== undefined && node.column === maxColumn;

    return {
      id: node.id,
      name: node.name,
      column: node.column,
      color: resolvedColor,
      // Intermediate stages have no outer side, so they keep the series default.
      dataLabels: isFirstColumn ? { align: 'left' } : isLastColumn ? { align: 'right' } : {},
    };
  });
};

/**
 * Resolves the text for a rendered node label. Highcharts identifies nodes by
 * `id` when one was supplied and by `name` otherwise; nodes it derived from link
 * topology alone are not in {@link nodesById} and keep their Highcharts name.
 */
export const resolveSankeyNodeLabel = ({
  nodeId,
  nodeName,
  nodesById,
  formatDataLabel,
}: {
  nodeId: string | undefined;
  nodeName: string | undefined;
  nodesById: ReadonlyMap<string, SankeyNode>;
  formatDataLabel?: (node: SankeyNode) => string;
}): string | undefined => {
  const node = nodeId === undefined ? undefined : nodesById.get(nodeId);
  if (!node) {
    return nodeName;
  }
  return formatDataLabel ? formatDataLabel(node) : node.name;
};
