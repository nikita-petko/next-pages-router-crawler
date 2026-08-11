import type { SeriesSankeyNodesOptionsObject, SeriesSankeyPointOptionsObject } from 'highcharts';
import type { TTheme } from '@rbx/ui';
import type { ChartColor } from '../color';
import { getChartColorHexString } from '../color';
import type { SankeyLink, SankeyNode } from '../types/SankeyChart';

/** Horizontal gap between a stage bar and its label (matches prior SVG chart). */
export const SankeyLabelGap = 12;

/**
 * Maps package-level Sankey nodes to Highcharts node options, assigning palette
 * colors when a node does not specify an explicit {@link SankeyNode.color}.
 *
 * When {@link SankeyNode.column} is set, also configures label side: final-stage
 * labels sit to the left of the bar; earlier stages sit to the right.
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

    const isLastColumn = node.column !== undefined && node.column === maxColumn;

    return {
      id: node.id,
      name: node.name,
      column: node.column,
      color: resolvedColor,
      dataLabels: {
        // Outside the bar with a gap; final stage flips to the left of the bar.
        inside: false,
        align: isLastColumn ? 'left' : 'right',
        verticalAlign: 'top',
        x: isLastColumn ? -SankeyLabelGap : SankeyLabelGap,
        y: 0,
        padding: 0,
      },
    };
  });
};

/** Maps package-level Sankey links to Highcharts sankey point options. */
export const buildSankeyLinks = (links: SankeyLink[]): SeriesSankeyPointOptionsObject[] =>
  links.map((link) => ({
    from: link.source,
    to: link.target,
    weight: link.value,
  }));

/**
 * Resolves the text for a rendered node label. Highcharts identifies nodes by
 * `id` when one was supplied and by `name` otherwise; nodes it derived from link
 * topology alone are not in {@link nodesById} and keep their Highcharts name.
 */
export const resolveSankeyNodeLabel = ({
  nodeId,
  nodeName,
  nodesById,
  formatNodeLabel,
}: {
  nodeId: string | undefined;
  nodeName: string | undefined;
  nodesById: ReadonlyMap<string, SankeyNode>;
  formatNodeLabel?: (node: SankeyNode) => string;
}): string | undefined => {
  const node = nodeId === undefined ? undefined : nodesById.get(nodeId);
  if (!node) {
    return nodeName;
  }
  return formatNodeLabel ? formatNodeLabel(node) : node.name;
};
