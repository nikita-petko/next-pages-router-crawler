import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { AnalyticsQueryGatewayAPIQueryResult } from '@modules/clients/analytics/analyticsQueryGateway';
import type { JourneyData, JourneyEdge, JourneyNode, SankeyLink, SankeyNode } from '../types';

function extractDimension(
  breakdownValue: { dimension?: string; value?: string }[] | undefined,
  dimension: string,
): string {
  return breakdownValue?.find((bv) => bv.dimension === dimension)?.value ?? '';
}

type TransitionRow = {
  fromNode: string;
  toNode: string;
  fromStage: number;
  toStage: number;
  countUsers: number;
  countTransitions: number;
};

function buildTransitionRows(
  countUserResult: AnalyticsQueryGatewayAPIQueryResult | null | undefined,
  countTransitionResult: AnalyticsQueryGatewayAPIQueryResult | null | undefined,
): TransitionRow[] {
  const transitionCountByEdge = new Map<string, number>();
  for (const mv of countTransitionResult?.values ?? []) {
    const fromNode = extractDimension(mv.breakdownValue, RAQIV2Dimension.FromNode);
    const toNode = extractDimension(mv.breakdownValue, RAQIV2Dimension.ToNode);
    if (!fromNode || !toNode) {
      continue;
    }
    const fromStage = extractDimension(mv.breakdownValue, RAQIV2Dimension.FromStage);
    const toStage = extractDimension(mv.breakdownValue, RAQIV2Dimension.ToStage);
    transitionCountByEdge.set(
      `${fromNode}:${fromStage}→${toNode}:${toStage}`,
      mv.dataPoints?.[0]?.value ?? 0,
    );
  }

  const rows: TransitionRow[] = [];
  for (const mv of countUserResult?.values ?? []) {
    const fromNode = extractDimension(mv.breakdownValue, RAQIV2Dimension.FromNode);
    const toNode = extractDimension(mv.breakdownValue, RAQIV2Dimension.ToNode);
    if (!fromNode || !toNode) {
      continue;
    }
    const fromStageStr = extractDimension(mv.breakdownValue, RAQIV2Dimension.FromStage);
    const toStageStr = extractDimension(mv.breakdownValue, RAQIV2Dimension.ToStage);
    rows.push({
      fromNode,
      toNode,
      fromStage: Number(fromStageStr || '0'),
      toStage: Number(toStageStr || '0'),
      countUsers: mv.dataPoints?.[0]?.value ?? 0,
      countTransitions:
        transitionCountByEdge.get(`${fromNode}:${fromStageStr}→${toNode}:${toStageStr}`) ?? 0,
    });
  }
  return rows;
}

export function adaptJourneyAPIResponse(
  countUserResult: AnalyticsQueryGatewayAPIQueryResult | null | undefined,
  countTransitionResult: AnalyticsQueryGatewayAPIQueryResult | null | undefined,
): { sankeyData: { nodes: SankeyNode[]; links: SankeyLink[] }; journeyData: JourneyData } {
  const rows = buildTransitionRows(countUserResult, countTransitionResult);

  // Sankey: nodes keyed by name:stage so the same event name at different stages
  // (e.g. a looping journey where "PlantSeed" appears at stage 1 and again at
  // stage 7) gets distinct node IDs. Without this the layout engine detects a
  // false cycle and returns undefined, rendering nothing.
  const sankeyNodeMap = new Map<string, { id: string; name: string; column: number }>();
  const sankeyLinks: SankeyLink[] = [];
  for (const row of rows) {
    const fromId = `${row.fromNode}:${row.fromStage}`;
    const toId = `${row.toNode}:${row.toStage}`;
    if (!sankeyNodeMap.has(fromId)) {
      sankeyNodeMap.set(fromId, { id: fromId, name: row.fromNode, column: row.fromStage });
    }
    if (!sankeyNodeMap.has(toId)) {
      sankeyNodeMap.set(toId, { id: toId, name: row.toNode, column: row.toStage });
    }
    sankeyLinks.push({ source: fromId, target: toId, value: row.countTransitions });
  }

  // JourneyData: compute node userCounts correctly
  // - Source nodes (no incoming edges): sum of outgoing — best approximation from edge data
  // - All other nodes: sum of incoming edges (exact count of users who arrived)
  // JourneyData nodes are keyed by name:stage (same as sankey) so a looping journey
  // where the same event appears at multiple stages gets distinct rows in the tables.
  const nodeMap = new Map<string, JourneyNode>();
  for (const row of rows) {
    const fromId = `${row.fromNode}:${row.fromStage}`;
    const toId = `${row.toNode}:${row.toStage}`;
    if (!nodeMap.has(fromId)) {
      nodeMap.set(fromId, { id: fromId, name: row.fromNode, stage: row.fromStage, userCount: 0 });
    }
    if (!nodeMap.has(toId)) {
      nodeMap.set(toId, { id: toId, name: row.toNode, stage: row.toStage, userCount: 0 });
    }
  }

  const incomingByNode = new Map<string, number>();
  const outgoingByNode = new Map<string, number>();
  for (const row of rows) {
    const fromId = `${row.fromNode}:${row.fromStage}`;
    const toId = `${row.toNode}:${row.toStage}`;
    incomingByNode.set(toId, (incomingByNode.get(toId) ?? 0) + row.countUsers);
    outgoingByNode.set(fromId, (outgoingByNode.get(fromId) ?? 0) + row.countUsers);
  }

  for (const [id, node] of nodeMap) {
    const incoming = incomingByNode.get(id) ?? 0;
    node.userCount = incoming > 0 ? incoming : (outgoingByNode.get(id) ?? 0);
  }

  const edges: JourneyEdge[] = rows.map((row) => ({
    fromNode: row.fromNode,
    toNode: row.toNode,
    fromStage: row.fromStage,
    toStage: row.toStage,
    userCount: row.countUsers,
    transitionCount: row.countTransitions,
  }));

  return {
    sankeyData: {
      nodes: Array.from(sankeyNodeMap.values()),
      links: sankeyLinks,
    },
    journeyData: { nodes: Array.from(nodeMap.values()), edges },
  };
}
