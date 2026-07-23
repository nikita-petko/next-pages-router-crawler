import type { FC } from 'react';
import {
  RAQIV2Dimension,
  RAQIV2UIPseudoDimension,
  type TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import { Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { RAQIV2QueryFilter } from '@modules/clients/analytics';
import { getChartConfiguratorDimensions } from '@modules/experience-analytics-shared/chartConfigurator/ChartConfiguratorDimensions';
import getGranularityOptionsForMetric from '@modules/experience-analytics-shared/chartConfigurator/getGranularityOptionsForMetric';
import {
  isNumericUIMetric,
  type TRAQIV2NumericUIMetric,
} from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import type {
  AnalyticsComponentConfig,
  CreatorAnalyticsUntabbedPageConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { getPageSurfaceMetrics } from '@modules/experience-analytics-shared/utils/getPredefinedComponentMetrics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import {
  DASHBOARD_TILE_EMPTY_STATE_CLASSES,
  DASHBOARD_TILE_SUMMARY_UNAVAILABLE_CLASSES,
} from './dashboardTileErrorClasses';

export type DashboardControlIssue =
  | {
      readonly kind: 'summary-breakdown';
      readonly dimensions: readonly TRAQIV2Dimension[];
    }
  | {
      readonly kind: 'unsupported-breakdown';
      readonly dimensions: readonly TRAQIV2Dimension[];
    }
  | {
      readonly kind: 'unsupported-filter';
      readonly dimensions: readonly TRAQIV2Dimension[];
    }
  | {
      readonly kind: 'unsupported-granularity';
    };

function toRAQIV2Dimension(dimension: string): TRAQIV2Dimension | null {
  if (
    isValidEnumValue(RAQIV2Dimension, dimension) ||
    isValidEnumValue(RAQIV2UIPseudoDimension, dimension)
  ) {
    return dimension;
  }
  return null;
}

function uniqueDimensions(dimensions: readonly TRAQIV2Dimension[]): readonly TRAQIV2Dimension[] {
  return Array.from(new Set(dimensions));
}

function getMetricsForComponent(
  component: AnalyticsComponentConfig,
): readonly TRAQIV2NumericUIMetric[] {
  return getPageSurfaceMetrics([component]).filter(isNumericUIMetric);
}

function isDimensionSupportedByAllMetrics(
  dimension: TRAQIV2Dimension,
  metrics: readonly TRAQIV2NumericUIMetric[],
): boolean {
  if (metrics.length === 0) {
    return true;
  }
  const dimensionsByMetric: Partial<Record<string, readonly TRAQIV2Dimension[]>> =
    getChartConfiguratorDimensions();
  return metrics.every((metric) => dimensionsByMetric[metric]?.includes(dimension) ?? false);
}

function getUnsupportedFilterDimensions(
  filters: readonly RAQIV2QueryFilter[] | undefined,
  metrics: readonly TRAQIV2NumericUIMetric[],
): readonly TRAQIV2Dimension[] {
  if (!filters?.length) {
    return [];
  }
  return uniqueDimensions(
    filters.flatMap((filter) => {
      const dimension = toRAQIV2Dimension(filter.dimension);
      if (!dimension || isDimensionSupportedByAllMetrics(dimension, metrics)) {
        return [];
      }
      return [dimension];
    }),
  );
}

function getUnsupportedGranularityIssue(
  chartContext: RAQIV2ChartContext,
  metrics: readonly TRAQIV2NumericUIMetric[],
): DashboardControlIssue | null {
  if (metrics.length === 0) {
    return null;
  }
  const hasUnsupportedMetric = metrics.some((metric) => {
    const options = getGranularityOptionsForMetric({
      metric,
      startDate: chartContext.timeSpec.startTime,
      endDate: chartContext.timeSpec.endTime,
      breakdown: chartContext.breakdown,
    });
    return !options.some(
      (option) => option.isAllowed && option.granularity === chartContext.granularity,
    );
  });
  return hasUnsupportedMetric ? { kind: 'unsupported-granularity' } : null;
}

/**
 * Whether each dashboard-level control is an explicit OVERRIDE (set at the
 * dashboard level) versus the inherit/unset state where each tile uses its own
 * config. Tile-control errors must only fire for explicit overrides — an
 * inherited granularity/breakdown/filter is the tile's own default and must
 * never surface an error (see Finding #4).
 */
export type DashboardControlOverrideState = {
  readonly granularity: boolean;
  readonly breakdown: boolean;
  readonly filter: boolean;
};

/**
 * Derive the dashboard-level override state from synthesis output. Granularity
 * is overridden when the dashboard persisted a `defaultGranularity`; breakdown
 * and filter are overridden when the resolved dashboard control carries a
 * value (an empty page-level breakdown/filter is the inherit state).
 */
export function getDashboardControlOverrideState(
  pageConfig: Pick<CreatorAnalyticsUntabbedPageConfig, 'defaultGranularity'>,
  chartContext: RAQIV2ChartContext,
): DashboardControlOverrideState {
  return {
    granularity: pageConfig.defaultGranularity !== undefined,
    breakdown: (chartContext.breakdown?.length ?? 0) > 0,
    filter: (chartContext.filter?.length ?? 0) > 0,
  };
}

export function getDashboardControlIssuesForComponent(
  component: AnalyticsComponentConfig,
  chartContext: RAQIV2ChartContext,
  controlOverrides: DashboardControlOverrideState,
): readonly DashboardControlIssue[] {
  const metrics = getMetricsForComponent(component);
  const breakdownDimensions = chartContext.breakdown ?? [];
  const issues: DashboardControlIssue[] = [];
  const isSummaryCard =
    typeof component === 'object' && component.type === AnalyticsComponentType.SummaryCard;

  if (controlOverrides.breakdown && breakdownDimensions.length > 0) {
    if (isSummaryCard) {
      issues.push({ kind: 'summary-breakdown', dimensions: breakdownDimensions });
    } else {
      const unsupportedBreakdowns = uniqueDimensions(
        breakdownDimensions.filter(
          (dimension) => !isDimensionSupportedByAllMetrics(dimension, metrics),
        ),
      );
      if (unsupportedBreakdowns.length > 0) {
        issues.push({ kind: 'unsupported-breakdown', dimensions: unsupportedBreakdowns });
      }
    }
  }

  if (controlOverrides.filter) {
    const unsupportedFilters = getUnsupportedFilterDimensions(chartContext.filter, metrics);
    if (unsupportedFilters.length > 0) {
      issues.push({ kind: 'unsupported-filter', dimensions: unsupportedFilters });
    }
  }

  if (!isSummaryCard && controlOverrides.granularity) {
    const granularityIssue = getUnsupportedGranularityIssue(chartContext, metrics);
    if (granularityIssue) {
      issues.push(granularityIssue);
    }
  }

  return issues;
}

/**
 * Summary-card unavailable state when dashboard-level controls don't apply.
 * Figma 2384-62450: value reads "N/A".
 */
const DashboardTileControlError: FC = () => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  return (
    <output className={DASHBOARD_TILE_SUMMARY_UNAVAILABLE_CLASSES}>
      <span className='text-heading-large content-emphasis'>
        {tPendingTranslation(
          'N/A',
          'Value shown on a custom dashboard summary card when dashboard-level controls do not apply to that card.',
          translationKey(
            'Label.CustomDashboards.Tile.SummaryUnavailable',
            TranslationNamespace.Analytics,
          ),
        )}
      </span>
    </output>
  );
};

/**
 * Per-tile error placeholder shown when a tile cannot be synthesized into a
 * known render component (e.g. unknown metric or unsupported chart type).
 * Centered empty-state chrome matches Figma 2384-62450 (Finding #2).
 */
export const DashboardTileRenderError: FC = () => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  return (
    <div role='alert' className={DASHBOARD_TILE_EMPTY_STATE_CLASSES}>
      <Icon name='icon-regular-circle-x' size='Large' className='content-muted' />
      <p className='text-label-medium content-emphasis margin-none'>
        {tPendingTranslation(
          "This tile can't be displayed.",
          'Headline for a custom dashboard tile that cannot be rendered because its metric or chart type is unavailable.',
          translationKey(
            'Error.CustomDashboards.Tile.RenderFailedHeadline',
            TranslationNamespace.Analytics,
          ),
        )}
      </p>
      <p className='text-body-small content-muted margin-none'>
        {tPendingTranslation(
          'This tile references a metric or chart type that is no longer available.',
          'Body text for a custom dashboard tile that cannot be rendered because its metric or chart type is unavailable.',
          translationKey(
            'Error.CustomDashboards.Tile.RenderFailedBody',
            TranslationNamespace.Analytics,
          ),
        )}
      </p>
    </div>
  );
};

export default DashboardTileControlError;
