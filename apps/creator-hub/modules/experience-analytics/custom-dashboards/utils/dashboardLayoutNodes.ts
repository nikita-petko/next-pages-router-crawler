import type { DashboardLayoutNode } from '../types';

export function isSummaryCardLayoutNode(node: DashboardLayoutNode): boolean {
  return node.type === 'Component' && node.component.type === 'SummaryCard';
}
