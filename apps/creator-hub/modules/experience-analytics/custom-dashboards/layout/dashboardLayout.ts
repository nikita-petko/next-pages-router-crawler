import {
  DashboardPageMode,
  type ChartTileConfig,
  type CustomDashboardChartRow,
  type CustomDashboardConfig,
  type DashboardComponent,
  type DashboardLayoutNode,
  type DashboardSurface,
  type SummaryCardTileConfig,
} from '../types';
import { selectChartRowsFromLayoutNodes } from './chartPlacements';

const emptyBodyNodes: ReadonlyArray<DashboardLayoutNode> = [];

export function getDashboardSurface(config: CustomDashboardConfig): DashboardSurface {
  return config.page.surface;
}

export function withDashboardSurface(
  config: CustomDashboardConfig,
  surface: DashboardSurface,
): CustomDashboardConfig {
  return {
    ...config,
    page: {
      mode: DashboardPageMode.Untabbed,
      surface,
    },
  };
}

export function chartComponentNode(chart: ChartTileConfig): DashboardLayoutNode {
  return {
    type: 'Component',
    component: {
      type: 'Chart',
      chart,
    },
  };
}

export function summaryCardComponentNode(summaryCard: SummaryCardTileConfig): DashboardLayoutNode {
  return {
    type: 'Component',
    component: {
      type: 'SummaryCard',
      summaryCard,
    },
  };
}

export function summaryCardsGridNode(
  summaryCards: ReadonlyArray<SummaryCardTileConfig>,
): DashboardLayoutNode {
  return {
    type: 'Flex',
    children: summaryCards.map(summaryCardComponentNode),
  };
}

export function chartRowLayoutNode(row: CustomDashboardChartRow): DashboardLayoutNode {
  return {
    type: 'Grid',
    columnCount: row.columnCount,
    children: row.tiles.map(chartComponentNode),
  };
}

function componentFromNode(node: DashboardLayoutNode): DashboardComponent | null {
  return node.type === 'Component' ? node.component : null;
}

function getSummaryCardFromNode(node: DashboardLayoutNode): SummaryCardTileConfig | null {
  const component = componentFromNode(node);
  return component?.type === 'SummaryCard' ? component.summaryCard : null;
}

function isSummaryCardCollectionNode(node: DashboardLayoutNode): boolean {
  return (
    (node.type === 'Flex' || node.type === 'Grid') &&
    node.children.length > 0 &&
    node.children.every((child) => getSummaryCardFromNode(child) !== null)
  );
}

export function getSummaryCards(
  config: CustomDashboardConfig,
): ReadonlyArray<SummaryCardTileConfig> {
  return getDashboardSurface(config).bodyNodes.flatMap((node) => {
    if (isSummaryCardCollectionNode(node) && (node.type === 'Flex' || node.type === 'Grid')) {
      return node.children
        .map(getSummaryCardFromNode)
        .filter((summaryCard): summaryCard is SummaryCardTileConfig => summaryCard !== null);
    }
    const summaryCard = getSummaryCardFromNode(node);
    return summaryCard ? [summaryCard] : [];
  });
}

export function getChartRows(
  config: CustomDashboardConfig,
): ReadonlyArray<CustomDashboardChartRow> {
  return selectChartRowsFromLayoutNodes(
    getDashboardSurface(config).bodyNodes.filter((node) => !isSummaryCardCollectionNode(node)),
  );
}

function getNonSummaryBodyNodes(config: CustomDashboardConfig): ReadonlyArray<DashboardLayoutNode> {
  return getDashboardSurface(config).bodyNodes.filter((node) => {
    if (isSummaryCardCollectionNode(node)) {
      return false;
    }
    return getSummaryCardFromNode(node) === null;
  });
}

export function withSummaryCards(
  config: CustomDashboardConfig,
  summaryCards: ReadonlyArray<SummaryCardTileConfig>,
): CustomDashboardConfig {
  const surface = getDashboardSurface(config);
  return withDashboardSurface(config, {
    ...surface,
    bodyNodes: [
      ...(summaryCards.length > 0 ? [summaryCardsGridNode(summaryCards)] : emptyBodyNodes),
      ...getNonSummaryBodyNodes(config),
    ],
  });
}

export function withChartRows(
  config: CustomDashboardConfig,
  rows: ReadonlyArray<CustomDashboardChartRow>,
): CustomDashboardConfig {
  const surface = getDashboardSurface(config);
  const summaryCards = getSummaryCards(config);
  return withDashboardSurface(config, {
    ...surface,
    bodyNodes: [
      ...(summaryCards.length > 0 ? [summaryCardsGridNode(summaryCards)] : emptyBodyNodes),
      ...rows.map(chartRowLayoutNode),
    ],
  });
}
