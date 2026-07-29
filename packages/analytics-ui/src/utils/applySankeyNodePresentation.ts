import type { Chart, Series, SVGElement } from 'highcharts';
import { buildSankeyNodeBarPath, getSankeyNodeBarCornerMode } from './sankeyNodeBarPaths';

type SankeyDataLabel = SVGElement & {
  element?: Element;
  getBBox: () => { width: number; height: number };
};

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
  dataLabel?: SankeyDataLabel;
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
  /** Horizontal gap between stage bar and label text. Defaults to 12. */
  labelGap?: number;
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

const DefaultLabelGap = 12;
const DefaultIdleLinkOpacity = 0.3;
const DefaultActiveLinkOpacity = 0.75;
const DefaultDimmedLinkOpacity = 0.1;
const DefaultDimmedNodeOpacity = 0.25;
/**
 * Caps how far a label baseline drops below the top of its bar. Highcharts
 * reports the full text bounding box, which includes descender padding, so tall
 * boxes would otherwise push single-line labels below thin bars.
 */
const MaxLabelBaselineOffset = 14;

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
 * Also places labels with a horizontal offset and optionally applies pinned
 * focus dimming for enableNodeFocus.
 */
export const applySankeyNodePresentation = (
  chart: Chart,
  {
    nodeRadius,
    borderWidth,
    borderColor,
    labelGap = DefaultLabelGap,
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
    const isLastColumn = column === columnCount - 1;
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

      const element = node.graphic.element;
      if (element) {
        element.setAttribute('d', path);
        element.setAttribute('stroke', borderColor);
        element.setAttribute('stroke-width', String(borderWidth));
        element.setAttribute('paint-order', 'stroke fill');
        element.setAttribute('stroke-linejoin', 'round');
        element.setAttribute('opacity', String(nodeOpacity));
        if (nodeId) {
          element.setAttribute('data-sankey-node', '');
          element.setAttribute('data-node-id', nodeId);
        }
      }

      node.graphic.attr({
        d: path,
        stroke: borderColor,
        'stroke-width': borderWidth,
        opacity: nodeOpacity,
      });
    }

    if (node.dataLabel) {
      const labelBox = node.dataLabel.getBBox();
      const anchorX = isLastColumn ? x - labelGap : x + width + labelGap;
      const textElement = node.dataLabel.element?.querySelector?.('text') ?? node.dataLabel.element;
      if (textElement) {
        textElement.setAttribute('text-anchor', isLastColumn ? 'end' : 'start');
      }
      node.dataLabel.attr({
        x: anchorX,
        y: y + Math.min(labelBox.height, MaxLabelBaselineOffset),
        opacity: nodeOpacity,
      });
    }
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
    point.graphic.element?.setAttribute('fill-opacity', String(linkOpacity));
  }
};
