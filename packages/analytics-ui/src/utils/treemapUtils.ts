import { SingleTreemapSeries, TreemapPoint } from '../types/TreemapChart';

export type ProcessedTreemapPoint = {
  id: string;
  name: string;
  value: number;
  parent?: string;
  colorValue?: number;
};

const getDepth = (point: TreemapPoint, pointById: Map<string, TreemapPoint>): number => {
  let depth = 1;
  let current: TreemapPoint | undefined = point;

  while (current?.parent !== undefined) {
    current = pointById.get(current.parent);
    if (!current) break;
    depth += 1;
  }

  return depth;
};

/** Returns a map of point id → depth (1-based). Root level = 1. */
export const getTreemapDepthMap = (dataPoints: TreemapPoint[]): Map<string, number> => {
  const pointById = new Map(dataPoints.map((p) => [p.id, p]));
  const depthMap = new Map<string, number>();
  dataPoints.forEach((point) => depthMap.set(point.id, getDepth(point, pointById)));
  return depthMap;
};

export const calculateTreemapMaxDepth = (dataPoints: TreemapPoint[]): number => {
  const pointById = new Map(dataPoints.map((p) => [p.id, p]));
  return dataPoints.reduce((max, point) => Math.max(max, getDepth(point, pointById)), 1);
};

export const calculateTreemapColorValues = (
  dataPoints: TreemapPoint[],
  rootTotal?: number,
): ProcessedTreemapPoint[] => {
  if (rootTotal !== undefined && rootTotal > 0) {
    return dataPoints.map((point) => ({
      id: point.id,
      name: point.name,
      value: point.value,
      parent: point.parent,
      colorValue: point.value / rootTotal,
    }));
  }

  // Color by sibling proportion: each node's share among its siblings
  const sumByParent = dataPoints.reduce((acc, point) => {
    if (point.value !== undefined) {
      acc.set(point.parent, (acc.get(point.parent) ?? 0) + point.value);
    }
    return acc;
  }, new Map<string | undefined, number>());

  const leafColorValues = new Map<string, number>();
  dataPoints.forEach((point) => {
    if (point.value !== undefined) {
      const levelSum = sumByParent.get(point.parent) ?? 1;
      const colorValue = point.value / levelSum;
      leafColorValues.set(point.id, colorValue);
    }
  });

  const getParentColorValue = (parentId: string): number | undefined => {
    const children = dataPoints.filter((p) => p.parent === parentId && p.value !== undefined);
    if (children.length === 0) return undefined;

    const largestChild = children.reduce(
      (max, child) => ((child.value ?? 0) > (max?.value ?? 0) ? child : max),
      children[0],
    );

    return leafColorValues.get(largestChild.id);
  };

  return dataPoints.map((point) => {
    let colorValue: number | undefined;

    if (point.value !== undefined) {
      colorValue = leafColorValues.get(point.id);
    } else {
      colorValue = getParentColorValue(point.id);
    }

    return {
      id: point.id,
      name: point.name,
      value: point.value,
      parent: point.parent,
      colorValue,
    };
  });
};

const OTHER_NODE_NAME = 'Other';
/**
 * After collapsing, a parent may end up with a single "Other" child that accounts
 * for all (or nearly all) of its value — making drilldown pointless. This function
 * removes such redundant "Other" nodes, turning the parent into a leaf.
 *
 * A single pass suffices: removing an "Other" makes its parent a leaf, but the
 * parent is a real named node (not "Other"), so it cannot become a new redundant
 * "Other" for its grandparent.
 */
export const pruneRedundantOtherNodes = (chartData: TreemapPoint[]): TreemapPoint[] => {
  const childrenByParent = new Map<string, TreemapPoint[]>();
  chartData.forEach((p) => {
    if (p.parent !== undefined) {
      if (!childrenByParent.has(p.parent)) childrenByParent.set(p.parent, []);
      childrenByParent.get(p.parent)!.push(p);
    }
  });

  const toRemove = new Set<string>();

  childrenByParent.forEach((children) => {
    if (children.length === 1 && children[0].name === OTHER_NODE_NAME) {
      toRemove.add(children[0].id);
    }
  });

  if (toRemove.size === 0) return chartData;
  return chartData.filter((p) => !toRemove.has(p.id));
};

/**
 * Bottom-up: at each level, group siblings whose value is below minDisplayPercentage
 * of root total into a single "Other" node (sum of their values). Root total is the
 * sum of top-level node values in chartData (or rootTotalOverride when provided, e.g. after stripping a single root).
 *
 * @param chartData – Flat list of treemap points (e.g. after root strip)
 * @param minDisplayPercentage – Minimum % of root total to show as separate node (e.g. 0.1 for 0.1%)
 * @param rootTotalOverride – If set, use this as root total for threshold (e.g. when chartData has no top-level nodes because root was stripped)
 */
export const collapseNodesBelowPercentage = (
  chartData: TreemapPoint[],
  minDisplayPercentage: number,
  rootTotalOverride?: number,
): TreemapPoint[] => {
  if (chartData.length === 0 || minDisplayPercentage <= 0) return chartData;

  const rootTotal =
    rootTotalOverride ??
    chartData.filter((p) => p.parent === undefined).reduce((sum, p) => sum + p.value, 0);
  if (rootTotal <= 0) return chartData;

  const threshold = rootTotal * (minDisplayPercentage / 100);
  const maxDepth = calculateTreemapMaxDepth(chartData);
  let current = [...chartData];

  for (let depth = maxDepth; depth >= 1; depth -= 1) {
    const depthMap = getTreemapDepthMap(current);
    const nodesAtDepth = current.filter((p) => depthMap.get(p.id) === depth);
    const byParent = new Map<string, TreemapPoint[]>();
    nodesAtDepth.forEach((p) => {
      const parentId = p.parent ?? '';
      if (!byParent.has(parentId)) byParent.set(parentId, []);
      byParent.get(parentId)!.push(p);
    });

    const toRemove = new Set<string>();
    const toAdd: TreemapPoint[] = [];

    byParent.forEach((children, parentId) => {
      const below = children.filter((c) => c.value < threshold);
      if (below.length === 0) return;
      const parent = parentId === '' ? undefined : parentId;
      toAdd.push({
        id: `other-${parentId || 'root'}`,
        name: OTHER_NODE_NAME,
        value: below.reduce((s, c) => s + c.value, 0),
        parent: parent || undefined,
      });
      below.forEach((c) => toRemove.add(c.id));
    });

    // Remove orphans: any node whose parent was just removed (so we don't leave e.g. other-a when parent 'a' is collapsed)
    for (let prev = 0; prev !== toRemove.size; ) {
      prev = toRemove.size;
      current.forEach((p) => {
        if (p.parent !== undefined && toRemove.has(p.parent)) {
          toRemove.add(p.id);
        }
      });
    }

    current = current.filter((p) => !toRemove.has(p.id)).concat(toAdd);
  }

  return pruneRedundantOtherNodes(current);
};

export type ProcessedTreemapResult = {
  data: ProcessedTreemapPoint[];
  rootId: string;
  rootName: string;
};

/**
 * Process treemap data for the chart.
 * - When exactly one node has no parent: that node is removed from data; its id/name are used as rootId/rootName. Returned data has no root point (children reference rootId as parent).
 * - When zero or multiple nodes have no parent: data is kept and a synthetic root with id 'root' and name from rootName option is added; rootId is 'root'.
 */
export const getProcessedTreemapData = (
  data: SingleTreemapSeries,
  options?: {
    /**
     * Minimum percentage of root total for a node to be shown individually.
     * Nodes below this (e.g. 0.1 for 0.1%) are grouped into an "Other" node per parent, bottom-up.
     */
    minDisplayPercentage?: number;
    /**
     * Root label used when there are multiple root nodes (or none).
     */
    rootName?: string;
    /**
     * When true (default), each node's color reflects its share among siblings.
     * When false, each node's color reflects its share of the root total.
     */
    colorBySiblingProportion?: boolean;
  },
): ProcessedTreemapResult => {
  const roots = data.filter((p) => p.parent === undefined);
  const minDisplayPercentage = options?.minDisplayPercentage;
  const rootNameOption = options?.rootName ?? 'root';
  const colorBySiblingProportion = !!options?.colorBySiblingProportion;

  if (roots.length === 1) {
    const root = roots[0];
    const rootId = root.id;
    const rootName = root.name;
    let restData = data.filter((p) => p.id !== rootId);
    if (minDisplayPercentage !== undefined && minDisplayPercentage > 0) {
      restData = collapseNodesBelowPercentage(restData, minDisplayPercentage, root.value);
    }
    const rootTotal = colorBySiblingProportion ? undefined : root.value;
    const processedRest = calculateTreemapColorValues(restData, rootTotal);
    return {
      data: processedRest,
      rootId,
      rootName,
    };
  }

  // Zero or multiple roots: keep data, add synthetic root with id 'root' and name from rootName option
  let chartData = data;
  if (minDisplayPercentage !== undefined && minDisplayPercentage > 0) {
    chartData = collapseNodesBelowPercentage(chartData, minDisplayPercentage);
  }
  const rootValue = chartData
    .filter((p) => p.parent === undefined)
    .reduce((sum, p) => sum + p.value, 0);
  const rootTotal = colorBySiblingProportion ? undefined : rootValue;
  const processed = calculateTreemapColorValues(chartData, rootTotal);
  const syntheticRoot: ProcessedTreemapPoint = {
    id: 'root',
    name: rootNameOption,
    value: rootValue,
    colorValue: 1,
  };
  const dataWithRoot = processed.map((p) =>
    p.parent === undefined ? { ...p, parent: 'root' as const } : p,
  );
  return {
    data: [syntheticRoot, ...dataWithRoot],
    rootId: 'root',
    rootName: rootNameOption,
  };
};
