import type { SingleTreemapSeries, TreemapPoint } from '@rbx/analytics-ui';
import type { GetCrashDumpFileResponse } from '@modules/clients/crashDumps';

export type TreemapNode = {
  id: string;
  name: string;
  size: number;
  nodes: TreemapNode[];
  /** Roblox class name (e.g. `Folder`, `Model`). Used to group identical siblings. */
  className?: string;
};

// ============================================================
// Phase 1 – Raw crash dump → TreemapNode
// ============================================================

/**
 * A node inside the raw `nodeData` tree from the backend.
 *
 * - Named properties: `className`, `name`, `size`, `numNodes`
 * - Numeric string keys (`"0"`, `"1"`, …) point to child nodes
 */
type RawCrashDumpNode = {
  className?: string;
  name: string;
  size: string;
  numNodes: string;
  [key: string]: unknown;
};

const NAMED_KEYS = new Set(['className', 'name', 'size', 'numNodes', 'collapsedDescendants']);
const isNumericKey = (key: string): boolean => !NAMED_KEYS.has(key) && /^\d+$/.test(key);

const isRawNode = (value: unknown): value is RawCrashDumpNode =>
  typeof value === 'object' &&
  value !== null &&
  'name' in value &&
  'size' in value &&
  'numNodes' in value;

const OTHER_NODE_NAME = 'Other';

/**
 * Minimum number of identical siblings (same `className` + `name`) required to
 * collapse them into one synthetic group node. Singletons pass through unchanged.
 */
const MIN_GROUP_COUNT = 2;

/** Format the display name for a grouped sibling node, e.g. `"Template (×528)"`. */
const formatGroupName = (name: string, count: number): string => `${name} (\u00D7${count})`;

/**
 * Collapse runs of siblings sharing the same `(className, name)` into a single
 * synthetic parent node. The originals become children of the group node so
 * drill-down still works.
 *
 * Grouping is only applied when `className` is a non-empty string — siblings
 * without a class identity are left as-is.
 */
const groupSimilarSiblings = (children: TreemapNode[]): TreemapNode[] => {
  if (children.length < MIN_GROUP_COUNT) {
    return children;
  }

  type Bucket = { members: TreemapNode[]; firstIndex: number };
  const buckets: Bucket[] = [];
  const groupableIndex = new Map<string, number>();

  children.forEach((child, idx) => {
    const { className } = child;
    if (!className) {
      buckets.push({ members: [child], firstIndex: idx });
      return;
    }
    const key = `${className}\u0000${child.name}`;
    const existingIdx = groupableIndex.get(key);
    if (existingIdx !== undefined) {
      buckets[existingIdx].members.push(child);
    } else {
      groupableIndex.set(key, buckets.length);
      buckets.push({ members: [child], firstIndex: idx });
    }
  });

  return buckets.map(({ members }) => {
    if (members.length < MIN_GROUP_COUNT) {
      return members[0];
    }
    const first = members[0];
    const totalSize = members.reduce((sum, m) => sum + m.size, 0);
    return {
      id: `${first.id}-group`,
      name: formatGroupName(first.name, members.length),
      size: totalSize,
      nodes: members,
      className: first.className,
    };
  });
};

/**
 * Recursively convert one raw node into a `TreemapNode`.
 *
 * Only processes numeric-key children and adds an "Other" node for the residual
 * (parent size minus sum of children sizes).
 */
const convertRawNode = (rawNode: RawCrashDumpNode, indexPath: string): TreemapNode => {
  const name = rawNode.name ?? 'Unknown';
  const className = typeof rawNode.className === 'string' ? rawNode.className : undefined;
  const size = rawNode.size ? parseInt(rawNode.size, 10) : 0;
  const nodeId = indexPath ? `root-${indexPath}` : 'root';

  const childKeys = Object.keys(rawNode)
    .filter(isNumericKey)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  const rawChildren = childKeys.reduce<TreemapNode[]>((acc, childKey) => {
    const childRaw = rawNode[childKey];
    if (isRawNode(childRaw)) {
      const childIndexPath = indexPath ? `${indexPath}-${childKey}` : childKey;
      acc.push(convertRawNode(childRaw, childIndexPath));
    }
    return acc;
  }, []);

  const children = groupSimilarSiblings(rawChildren);

  if (children.length > 0) {
    const childrenSizeSum = children.reduce((sum, c) => sum + c.size, 0);
    const residualSize = size - childrenSizeSum;

    if (residualSize > 0) {
      // ID is keyed off the raw child count so it never collides with an
      // original index that was absorbed into a group node.
      children.push({
        id: `${nodeId}-${childKeys.length}`,
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
    className,
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
