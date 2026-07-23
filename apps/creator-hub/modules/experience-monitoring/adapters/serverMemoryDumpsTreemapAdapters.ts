import type { SingleTreemapSeries, TreemapPoint } from '@rbx/analytics-ui';
import type { GetCrashDumpFileResponse } from '@modules/clients/crashDumps';

export type TreemapNode = {
  id: string;
  name: string;
  size: number;
  nodes: TreemapNode[];
};

// ============================================================
// Phase 1 – Raw crash dump → TreemapNode
// ============================================================

/**
 * A node inside the raw `nodeData` tree from the backend.
 *
 * - Named properties: `name`, `size`, `numNodes`
 * - Numeric string keys (`"0"`, `"1"`, …) point to child nodes
 */
type RawCrashDumpNode = {
  name: string;
  size: string;
  numNodes: string;
  [key: string]: unknown;
};

const NAMED_KEYS = new Set(['name', 'size', 'numNodes', 'collapsedDescendants']);
const isNumericKey = (key: string): boolean => !NAMED_KEYS.has(key) && /^\d+$/.test(key);

const isRawNode = (value: unknown): value is RawCrashDumpNode =>
  typeof value === 'object' &&
  value !== null &&
  'name' in value &&
  'size' in value &&
  'numNodes' in value;

const OTHER_NODE_NAME = 'Other';

/**
 * Recursively convert one raw node into a `TreemapNode`.
 *
 * Only processes numeric-key children and adds an "Other" node for the residual
 * (parent size minus sum of children sizes).
 */
const convertRawNode = (rawNode: RawCrashDumpNode, indexPath: string): TreemapNode => {
  const name = rawNode.name ?? 'Unknown';
  const size = rawNode.size ? parseInt(rawNode.size, 10) : 0;
  const nodeId = indexPath ? `root-${indexPath}` : 'root';

  const childKeys = Object.keys(rawNode)
    .filter(isNumericKey)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  const children = childKeys.reduce<TreemapNode[]>((acc, childKey) => {
    const childRaw = rawNode[childKey];
    if (isRawNode(childRaw)) {
      const childIndexPath = indexPath ? `${indexPath}-${childKey}` : childKey;
      acc.push(convertRawNode(childRaw, childIndexPath));
    }
    return acc;
  }, []);

  if (children.length > 0) {
    const childrenSizeSum = children.reduce((sum, c) => sum + c.size, 0);
    const residualSize = size - childrenSizeSum;

    if (residualSize > 0) {
      children.push({
        id: `${nodeId}-${children.length}`,
        name: OTHER_NODE_NAME,
        size: residualSize,
        nodes: [],
      });
    }
  }

  return {
    id: nodeId,
    name,
    size,
    nodes: children,
  };
};

/**
 * **Phase 1** – Convert a raw `GetCrashDumpFileResponse` into a
 * validated `TreemapNode` tree.
 */
export const convertRawToTreemapNode = (
  crashDump: GetCrashDumpFileResponse,
): TreemapNode | null => {
  const { nodeData } = crashDump;
  if (!isRawNode(nodeData)) {
    return null;
  }
  return convertRawNode(nodeData, '');
};

// ============================================================
// Phase 2 – TreemapNode → TreemapPoint[]
// ============================================================

/**
 * Recursively flatten a `TreemapNode` tree into a `TreemapPoint[]`.
 * All levels are included; level visibility is handled by the chart via minDisplayPercentage.
 */
const flattenNode = (
  node: TreemapNode,
  parentId: string | undefined,
  points: TreemapPoint[],
): void => {
  const point: TreemapPoint = {
    id: node.id,
    name: node.name,
    value: node.size,
  };

  if (parentId !== undefined) {
    point.parent = parentId;
  }

  points.push(point);

  node.nodes.forEach((child) => {
    flattenNode(child, node.id, points);
  });
};

/**
 * **Phase 2** – Convert a `TreemapNode` tree into a flat `TreemapPoint[]`
 * that the `TreemapChart` component can render.
 *
 * The root node is always included as the top-level point (no `parent`),
 * so the data is self-describing — the root info is part of the array.
 * Level visibility (e.g. collapsing small nodes) is handled by the chart via minDisplayPercentage.
 */
export const convertTreemapNodeToSeries = (root: TreemapNode): SingleTreemapSeries => {
  const dataPoints: TreemapPoint[] = [];
  flattenNode(root, undefined, dataPoints);
  return dataPoints;
};

// ============================================================
// Combined adapter (default export)
// ============================================================

/**
 * Convert a crash dump response to `TreemapPoint[]` for the chart.
 *
 * Chains **Phase 1** (raw → `TreemapNode`) and
 * **Phase 2** (`TreemapNode` → `TreemapPoint[]`).
 * Level visibility is handled by the chart via minDisplayPercentage.
 */
const convertCrashDumpToTreemapSeries = (
  crashDump: GetCrashDumpFileResponse,
): SingleTreemapSeries => {
  const root = convertRawToTreemapNode(crashDump);
  if (!root) {
    return [];
  }
  return convertTreemapNodeToSeries(root);
};

export default convertCrashDumpToTreemapSeries;
