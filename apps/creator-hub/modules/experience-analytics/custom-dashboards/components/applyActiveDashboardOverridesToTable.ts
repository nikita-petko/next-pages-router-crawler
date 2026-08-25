import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { isCustomTableColumnConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableColumnConfig';
import type { AnalyticsTableConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableConfig';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import { getDashboardControlOverrideState } from './DashboardTileControlError';

/**
 * Apply an *active* dashboard-level breakdown onto a synthesized table tile.
 *
 * Synthesis pins each metric column's query `breakdown` / `granularity` from
 * the tile (`buildChartConfiguratorTableConfig`) so an empty/default page
 * `tableContext` cannot replace the tile axes (DSA-6141 N/A). That pin would
 * also hide a real dashboard breakdown override. When the page breakdown is
 * an active override (`getDashboardControlOverrideState`), replace the pin
 * and the display `breakdowns` with that same dashboard value — override, not
 * intersect/union. Mixed tiles stay mixed when the page control is inherit.
 *
 * Granularity is left on the tile pin. Custom dashboards hide the page grain
 * control, and override state does not treat surface grain as active.
 */
export function applyActiveDashboardOverridesToTable(
  table: AnalyticsTableConfig,
  chartContext: RAQIV2ChartContext,
): AnalyticsTableConfig {
  const { breakdown: hasBreakdownOverride } = getDashboardControlOverrideState(chartContext);
  if (!hasBreakdownOverride) {
    return table;
  }

  const dashboardBreakdown: TRAQIV2Dimension[] = [...(chartContext.breakdown ?? [])];
  return {
    ...table,
    breakdowns: [...dashboardBreakdown],
    dataColumns: table.dataColumns.map((column) => {
      if (isCustomTableColumnConfig(column)) {
        return column;
      }
      return {
        ...column,
        overrides: {
          ...column.overrides,
          breakdown: { override: [...dashboardBreakdown] },
        },
      };
    }),
  };
}
