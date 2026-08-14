import type { Chart, Series, SVGElement } from 'highcharts';
import { buildSankeyNodeBarPath, getSankeyNodeBarCornerMode } from './sankeyNodeBarPaths';

type SankeyNodePoint = {
  isNode?: boolean;
  id?: string;
  name?: string;
  column?: number;
  shapeArgs?: {
    x: number;
    y: number;
    width: number;
    height: number;
    display?: string;
  };
  graphic?: SVGElement & {
    element?: Element;
  };
  dataLabel?: SVGElement;
};

type SankeyLinkPoint = {
  isNode?: boolean;
  fromNode?: { id?: string; name?: string };
  toNode?: { id?: string; name?: string };
  graphic?: SVGElement & {
    element?: Element;
  };
};

type SankeySeriesLike = {
  type?: string;
  nodes?: SankeyNodePoint[];
  points?: SankeyLinkPoint[];
  nodeColumns?: unknown[];
};

export type SankeyNodePresentationOptions = {
  nodeRadius: number;
  borderWidth: number;
  borderColor: string;
  /**
   * When set, dims nodes/links that are not connected to this node id
   * (click-to-focus pin).
   */
  focusedNodeId?: string;
  idleLinkOpacity?: number;
  activeLinkOpacity?: number;
  dimmedLinkOpacity?: number;
  dimmedNodeOpacity?: number;
};

const DefaultIdleLinkOpacity = 0.3;
const DefaultActiveLinkOpacity = 0.75;
const DefaultDimmedLinkOpacity = 0.1;
const DefaultDimmedNodeOpacity = 0.25;

const isSankeySeries = (series: Series): series is Series & SankeySeriesLike =>
  series.type === 'sankey';

const getNodeId = (node: { id?: string; name?: string } | undefined): string | undefined =>
  node?.id ?? node?.name;

/**
 * Link points hold live references to their end nodes. Highcharts does not
 * assign ids to links, so focus is resolved through node identity.
 */
const isLinkConnectedToNode = (point: SankeyLinkPoint, nodeId: string): boolean =>
  getNodeId(point.fromNode) === nodeId || getNodeId(point.toNode) === nodeId;

/**
 * Highcharts Sankey only supports uniform corner radii on node bars. Re-shape
 * each node after render so stage-0 bars round on the leading edge, sink bars
 * round on the trailing edge, and intermediate stages stay pill-shaped.
 *
 * Also applies pinned focus dimming for click-to-focus. Label placement is left
 * to Highcharts (see the `dataLabels` options in `buildSankeyNodes`).
 */
export const applySankeyNodePresentation = (
  chart: Chart,
  {
    nodeRadius,
    borderWidth,
    borderColor,
    focusedNodeId,
    idleLinkOpacity = DefaultIdleLinkOpacity,
    activeLinkOpacity = DefaultActiveLinkOpacity,
    dimmedLinkOpacity = DefaultDimmedLinkOpacity,
    dimmedNodeOpacity = DefaultDimmedNodeOpacity,
  }: SankeyNodePresentationOptions,
): void => {
  const sankeySeries = chart.series.find(isSankeySeries);
  if (!sankeySeries?.nodes?.length) {
    return;
  }

  const columnCount = Math.max(1, sankeySeries.nodeColumns?.length ?? 1);

  const activeNodeIds = new Set<string>();
  if (focusedNodeId) {
    activeNodeIds.add(focusedNodeId);
    for (const point of sankeySeries.points ?? []) {
      if (point.isNode || !isLinkConnectedToNode(point, focusedNodeId)) {
        continue;
      }
      const fromId = getNodeId(point.fromNode);
      const toId = getNodeId(point.toNode);
      if (fromId) {
        activeNodeIds.add(fromId);
      }
      if (toId) {
        activeNodeIds.add(toId);
      }
    }
  }

  for (const node of sankeySeries.nodes) {
    if (!node.isNode || !node.shapeArgs || node.shapeArgs.display === 'none') {
      continue;
    }

    const { x, y, width, height } = node.shapeArgs;
    const column = node.column ?? 0;
    const nodeId = getNodeId(node);
    const nodeOpacity =
      focusedNodeId === undefined ? 1 : nodeId && activeNodeIds.has(nodeId) ? 1 : dimmedNodeOpacity;

    if (node.graphic) {
      const cornerMode = getSankeyNodeBarCornerMode({
        column,
        columnCount,
      });
      const path = buildSankeyNodeBarPath({
        x,
        y,
        width,
        height,
        radius: nodeRadius,
        cornerMode,
      });

      // Use the Highcharts API for attributes Highcharts manages so its
      // internal state stays consistent with the DOM on redraws.
      node.graphic.attr({
        d: path,
        stroke: borderColor,
        'stroke-width': borderWidth,
        opacity: nodeOpacity,
      });

      // SVG presentation attributes Highcharts does not manage — these must
      // be set directly on the DOM element.
      const element = node.graphic.element;
      if (element) {
        element.setAttribute('paint-order', 'stroke fill');
        element.setAttribute('stroke-linejoin', 'round');
        if (nodeId) {
          element.setAttribute('data-sankey-node', '');
          element.setAttribute('data-node-id', nodeId);
        }
      }
    }

    // The series neutralizes Highcharts' `inactive` state while focus is
    // pinned, so labels only fade if we dim them alongside their bar.
    node.dataLabel?.attr({ opacity: nodeOpacity });
  }

  for (const point of sankeySeries.points ?? []) {
    if (point.isNode || !point.graphic) {
      continue;
    }
    const linkOpacity =
      focusedNodeId === undefined
        ? idleLinkOpacity
        : isLinkConnectedToNode(point, focusedNodeId)
          ? activeLinkOpacity
          : dimmedLinkOpacity;

    point.graphic.attr({
      'fill-opacity': linkOpacity,
      opacity: 1,
    });
  }
};
