import { type FC, useMemo } from 'react';
import AnalyticsComponent from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsComponent';
import useRAQIV2PredefinedSurfaceControlsBundle from '@modules/experience-analytics-shared/components/RAQIV2/layout/useRAQIV2PredefinedSurfaceControlsBundle';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import type {
  AnalyticsComponentConfig,
  CreatorAnalyticsUntabbedPageConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import type { SynthesizeResult } from '../synthesis/synthesize';
import type { CustomDashboardConfig, DashboardLayoutNode, TileId } from '../types';
import { isSummaryCardLayoutNode } from '../utils/dashboardLayoutNodes';
import DashboardFilterChips from './DashboardFilterChips';
import {
  DASHBOARD_BODY_COMPONENT_NODE_CLASSES,
  DASHBOARD_BODY_FLEX_CLASSES,
  DASHBOARD_BODY_GRID_ONE_COLUMN_CLASSES,
  DASHBOARD_BODY_GRID_TWO_COLUMN_CLASSES,
  DASHBOARD_BODY_STACK_CLASSES,
  DASHBOARD_BODY_SUMMARY_COLLECTION_CLASSES,
  DASHBOARD_BODY_SUMMARY_COMPONENT_NODE_CLASSES,
} from './dashboardLayoutClasses';
import DashboardTileControlError, {
  DashboardTileRenderError,
  getDashboardControlIssuesForComponent,
  getDashboardControlOverrideState,
  type DashboardControlOverrideState,
} from './DashboardTileControlError';

function buildComponentByTileId(
  synthesis: SynthesizeResult,
): ReadonlyMap<TileId, AnalyticsComponentConfig> {
  const components = new Map<TileId, AnalyticsComponentConfig>();
  synthesis.summaries.forEach((entry) => components.set(entry.tileId, entry.component));
  synthesis.chartRows.forEach((row) =>
    row.forEach((entry) => components.set(entry.tileId, entry.component)),
  );
  return components;
}

function isSummaryCardCollectionNode(node: DashboardLayoutNode): boolean {
  return (
    (node.type === 'Flex' || node.type === 'Grid') &&
    node.children.length > 0 &&
    node.children.every(isSummaryCardLayoutNode)
  );
}

type DashboardLayoutNodeViewProps = {
  readonly node: DashboardLayoutNode;
  readonly chartContext: RAQIV2ChartContext;
  readonly componentByTileId: ReadonlyMap<TileId, AnalyticsComponentConfig>;
  readonly controlOverrides: DashboardControlOverrideState;
  readonly componentNodeClassName?: string;
};

const DashboardLayoutNodeView: FC<DashboardLayoutNodeViewProps> = ({
  node,
  chartContext,
  componentByTileId,
  controlOverrides,
  componentNodeClassName = DASHBOARD_BODY_COMPONENT_NODE_CLASSES,
}) => {
  const isSummaryComponentNode =
    componentNodeClassName === DASHBOARD_BODY_SUMMARY_COMPONENT_NODE_CLASSES;
  if (node.type === 'Component') {
    const tileId =
      node.component.type === 'Chart'
        ? node.component.chart.tileId
        : node.component.summaryCard.tileId;
    const component = componentByTileId.get(tileId);
    if (!component) {
      // The tile exists in the layout but failed to synthesize into a known
      // component (e.g. unknown metric/chart type). Surface a per-tile error
      // placeholder instead of a silent empty hole (Finding #2).
      return (
        <div
          className={componentNodeClassName}
          data-testid={isSummaryComponentNode ? 'dashboard-summary-component-node' : undefined}>
          <DashboardTileRenderError />
        </div>
      );
    }
    const issues = getDashboardControlIssuesForComponent(component, chartContext, controlOverrides);
    // Charts keep their card chrome and surface Figma empty states via
    // genericChartStateToChartAbnormalState. Summary cards that can't honor
    // dashboard controls show `--` instead of an alert card.
    const showSummaryUnavailable = isSummaryComponentNode && issues.length > 0;
    return (
      <div
        className={componentNodeClassName}
        data-testid={isSummaryComponentNode ? 'dashboard-summary-component-node' : undefined}>
        {showSummaryUnavailable ? (
          <DashboardTileControlError />
        ) : (
          <AnalyticsComponent
            config={component}
            chartContext={chartContext}
            onSelectChartRegion={null}
          />
        )}
      </div>
    );
  }
  if (node.type === 'Grid') {
    const isSummaryCollection = isSummaryCardCollectionNode(node);
    return (
      <div
        data-testid={isSummaryCollection ? 'dashboard-summary-collection' : undefined}
        className={
          isSummaryCollection
            ? DASHBOARD_BODY_SUMMARY_COLLECTION_CLASSES
            : node.columnCount === 1
              ? DASHBOARD_BODY_GRID_ONE_COLUMN_CLASSES
              : DASHBOARD_BODY_GRID_TWO_COLUMN_CLASSES
        }>
        {node.children.map((child, index) => (
          <DashboardLayoutNodeView
            // Layout node order is stable for a loaded dashboard document.
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            node={child}
            chartContext={chartContext}
            componentByTileId={componentByTileId}
            controlOverrides={controlOverrides}
            componentNodeClassName={
              isSummaryCollection
                ? DASHBOARD_BODY_SUMMARY_COMPONENT_NODE_CLASSES
                : DASHBOARD_BODY_COMPONENT_NODE_CLASSES
            }
          />
        ))}
      </div>
    );
  }
  if (node.type === 'Flex') {
    const isSummaryCollection = isSummaryCardCollectionNode(node);
    return (
      <div
        data-testid={isSummaryCollection ? 'dashboard-summary-collection' : undefined}
        className={
          isSummaryCollection
            ? DASHBOARD_BODY_SUMMARY_COLLECTION_CLASSES
            : DASHBOARD_BODY_FLEX_CLASSES
        }>
        {node.children.map((child, index) => (
          <DashboardLayoutNodeView
            // Layout node order is stable for a loaded dashboard document.
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            node={child}
            chartContext={chartContext}
            componentByTileId={componentByTileId}
            controlOverrides={controlOverrides}
            componentNodeClassName={
              isSummaryCollection
                ? DASHBOARD_BODY_SUMMARY_COMPONENT_NODE_CLASSES
                : DASHBOARD_BODY_COMPONENT_NODE_CLASSES
            }
          />
        ))}
      </div>
    );
  }
  return (
    <div className={DASHBOARD_BODY_STACK_CLASSES}>
      {node.children.map((child, index) => (
        <DashboardLayoutNodeView
          // Layout node order is stable for a loaded dashboard document.
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          node={child}
          chartContext={chartContext}
          componentByTileId={componentByTileId}
          controlOverrides={controlOverrides}
        />
      ))}
    </div>
  );
};

type DashboardLayoutBodyProps = {
  readonly config: CustomDashboardConfig;
  readonly pageConfig: CreatorAnalyticsUntabbedPageConfig;
  readonly synthesis: SynthesizeResult;
};

const DashboardLayoutBody: FC<DashboardLayoutBodyProps> = ({ config, pageConfig, synthesis }) => {
  const { chartContext } = useRAQIV2PredefinedSurfaceControlsBundle(pageConfig);
  const componentByTileId = useMemo(() => buildComponentByTileId(synthesis), [synthesis]);
  const controlOverrides = useMemo(
    () => getDashboardControlOverrideState(pageConfig, chartContext),
    [pageConfig, chartContext],
  );
  return (
    <div className={DASHBOARD_BODY_STACK_CLASSES}>
      <DashboardFilterChips pageConfig={pageConfig} />
      {config.page.surface.bodyNodes.map((node, index) => (
        <DashboardLayoutNodeView
          // Layout node order is stable for the loaded dashboard.
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          node={node}
          chartContext={chartContext}
          componentByTileId={componentByTileId}
          controlOverrides={controlOverrides}
        />
      ))}
    </div>
  );
};

export default DashboardLayoutBody;
