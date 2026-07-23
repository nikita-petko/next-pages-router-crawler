import type { DagGraph } from '@rbx/client-analytics-query-gateway/v1';
import sanitizeFilterValuesForBackend from './sanitizeFilterValuesForBackend';

/**
 * DAG requests carry filters per query-node rather than at the request root,
 * so the request-level `clientToApiFilter` (used in the regular query / dim
 * lookup paths) doesn't reach them. This walks the graph and applies the same
 * sanitization to every query node's `filters`, keeping reserved sentinel
 * values (e.g. `RAQI_RESERVED_DIMENSION_VALUES_UNKNOWN`) from leaking through
 * to druid via the computed-metric / DAG path. Non-query nodes (constant,
 * math, rolling window, output) carry no filters and are passed through
 * untouched.
 *
 * Generic over the wrapper request type so the same helper covers both
 * `ExecuteDagRequest` and `ValidateDagRequest` — the only field we touch is
 * `graph.nodes[].queryConfig.filters`, which is identical between them.
 *
 * Returns the same request reference when nothing was stripped, mirroring the
 * fast-path semantics of `sanitizeFilterValuesForBackend` to avoid unnecessary
 * object copies for the common case.
 */
const sanitizeDagRequest = <T extends { graph?: DagGraph }>(request: T): T => {
  const { graph } = request;
  if (!graph?.nodes?.length) {
    return request;
  }
  let didChange = false;
  const sanitizedNodes = graph.nodes.map((node) => {
    const queryFilters = node.queryConfig?.filters;
    if (!queryFilters?.length) {
      return node;
    }
    // Walk filters element-wise so we can keep the original node reference
    // when nothing changes (downstream identity-based memoization stays stable
    // for clean nodes), and only allocate a fresh node when at least one
    // filter actually had a sentinel stripped.
    let nodeChanged = false;
    const cleanedFilters: typeof queryFilters = [];
    queryFilters.forEach((filter) => {
      const cleaned = sanitizeFilterValuesForBackend(filter);
      if (cleaned === null) {
        nodeChanged = true;
        return;
      }
      if (cleaned !== filter) {
        nodeChanged = true;
      }
      cleanedFilters.push(cleaned);
    });
    if (!nodeChanged) {
      return node;
    }
    didChange = true;
    return {
      ...node,
      queryConfig: {
        ...node.queryConfig,
        filters: cleanedFilters,
      },
    };
  });
  if (!didChange) {
    return request;
  }
  return {
    ...request,
    graph: {
      ...graph,
      nodes: sanitizedNodes,
    },
  };
};

export default sanitizeDagRequest;
