import { RAQIV2Dimension, type TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { toSelectableBreakdownDimensions } from '@modules/experience-analytics-shared/chartConfigurator/ChartConfiguratorDimensions';

const CUSTOM_DASHBOARD_EXCLUDED_BREAKDOWN_DIMENSIONS: ReadonlySet<string> = new Set([
  RAQIV2Dimension.Country,
  RAQIV2Dimension.Locale,
]);

export function getCustomDashboardBreakdownDimensions(
  dimensions: readonly TRAQIV2Dimension[],
): readonly TRAQIV2Dimension[] {
  return toSelectableBreakdownDimensions(dimensions).filter(
    (dimension) => !CUSTOM_DASHBOARD_EXCLUDED_BREAKDOWN_DIMENSIONS.has(dimension),
  );
}
