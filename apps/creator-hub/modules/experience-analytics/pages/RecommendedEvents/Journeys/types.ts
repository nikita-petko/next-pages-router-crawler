export type { SankeyNode, SankeyLink } from '@rbx/analytics-ui';

export type JourneySankeyMetric = 'sessions' | 'users';

export const JOURNEY_SANKEY_METRIC_TABS: readonly JourneySankeyMetric[] = ['sessions', 'users'];

export type JourneyNode = {
  id: string;
  name: string;
  stage: number;
  userCount: number;
};

export type JourneyEdge = {
  fromNode: string;
  toNode: string;
  fromStage: number;
  toStage: number;
  userCount: number;
  transitionCount: number;
};

export type JourneyData = {
  nodes: JourneyNode[];
  edges: JourneyEdge[];
};
