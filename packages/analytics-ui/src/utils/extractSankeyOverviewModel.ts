import type { Chart, Series } from 'highcharts';

/**
 * Lightweight geometry for the Sankey overview minimap, extracted from a
 * rendered Highcharts sankey chart (plot coordinates offset into chart space).
 */
export type SankeyOverviewModel = {
  width: number;
  height: number;
  nodes: Array<{
    id: string;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    color: string;
  }>;
  links: Array<{
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    color: string;
  }>;
};

type ShapeArgs = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

type OverviewNode = {
  isNode?: boolean;
  id?: string;
  name?: string;
  column?: number;
  color?: string | object;
  shapeArgs?: ShapeArgs;
  graphic?: { element?: Element };
};

type OverviewLink = {
  isNode?: boolean;
  id?: string;
  color?: string | object;
  fromNode?: OverviewNode & { nodeX?: number; nodeY?: number };
  toNode?: OverviewNode & { nodeX?: number; nodeY?: number };
  linkBase?: number[];
  weight?: number;
  shapeArgs?: { d?: unknown };
};

type OverviewSeries = {
  type?: string;
  nodes?: OverviewNode[];
  points?: OverviewLink[];
  nodeWidth?: number;
  translationFactor?: number;
  options?: { minLinkWidth?: number };
};

const isSankeySeries = (series: Series): series is Series & OverviewSeries =>
  series.type === 'sankey';

const colorToString = (color: unknown): string => {
  if (typeof color === 'string' && color.length > 0) {
    return color;
  }
  return '#888888';
};

/** Builds a minimap model from the live Highcharts sankey series. */
export const extractSankeyOverviewModel = (chart: Chart): SankeyOverviewModel | undefined => {
  const series = chart.series.find(isSankeySeries);
  if (!series?.nodes?.length) {
    return undefined;
  }

  const plotLeft = chart.plotLeft ?? 0;
  const plotTop = chart.plotTop ?? 0;
  const width = chart.chartWidth ?? 0;
  const height = chart.chartHeight ?? 0;
  if (width <= 0 || height <= 0) {
    return undefined;
  }

  const nodes = series.nodes.flatMap((node, index) => {
    if (!node.isNode || !node.shapeArgs) {
      return [];
    }
    const x = (node.shapeArgs.x ?? 0) + plotLeft;
    const y = (node.shapeArgs.y ?? 0) + plotTop;
    const nodeWidth = node.shapeArgs.width ?? 0;
    const nodeHeight = node.shapeArgs.height ?? 0;
    return [
      {
        id: node.id ?? node.name ?? `node-${index}`,
        x0: x,
        y0: y,
        x1: x + nodeWidth,
        y1: y + nodeHeight,
        color: colorToString(node.color),
      },
    ];
  });

  const translationFactor = series.translationFactor ?? 1;
  const minLinkWidth = series.options?.minLinkWidth ?? 0;
  // Highcharts types series points as plain `Point`s; sankey links add link ends.
  const linkPoints: OverviewLink[] = series.points ?? [];
  const links = linkPoints.flatMap((point, index) => {
    if (point.isNode || !point.fromNode?.shapeArgs || !point.toNode?.shapeArgs) {
      return [];
    }
    const fromArgs = point.fromNode.shapeArgs;
    const toArgs = point.toNode.shapeArgs;
    // Highcharts stores link ends as [fromTop, fromBottom, toTop, toBottom].
    const linkBase = point.linkBase;
    const linkHeightFromBase =
      linkBase && linkBase.length >= 4 ? Math.abs(linkBase[1] - linkBase[0]) : undefined;
    const linkHeight = Math.max(
      linkHeightFromBase ?? (point.weight ?? 0) * translationFactor,
      minLinkWidth,
    );
    const fromY =
      linkBase && linkBase.length >= 2
        ? (linkBase[0] + linkBase[1]) / 2
        : (fromArgs.y ?? 0) + (fromArgs.height ?? 0) / 2;
    const toY =
      linkBase && linkBase.length >= 4
        ? (linkBase[2] + linkBase[3]) / 2
        : (toArgs.y ?? 0) + (toArgs.height ?? 0) / 2;

    return [
      {
        id: point.id ?? `link-${index}`,
        x1: (fromArgs.x ?? 0) + (fromArgs.width ?? 0) + plotLeft,
        y1: fromY + plotTop,
        x2: (toArgs.x ?? 0) + plotLeft,
        y2: toY + plotTop,
        width: Math.max(1, linkHeight),
        color: colorToString(point.color ?? point.fromNode.color),
      },
    ];
  });

  return { width, height, nodes, links };
};
