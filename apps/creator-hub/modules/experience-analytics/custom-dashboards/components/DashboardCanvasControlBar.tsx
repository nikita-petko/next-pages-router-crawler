import { type FC, useMemo } from 'react';
import useRAQIV2PredefinedSurfaceControlsBundle from '@modules/experience-analytics-shared/components/RAQIV2/layout/useRAQIV2PredefinedSurfaceControlsBundle';
import {
  getFilterBarDimensionForRAQIV2Dimension,
  type TSupportedFilterBarDimensions,
} from '@modules/experience-analytics-shared/constants/FilterDimensionConfig';
import { useMixedAnalyticsCurrentFilterBundle } from '@modules/experience-analytics-shared/context/AnalyticsCurrentFilterBundleProvider';
import ExperienceAnalyticsPageFilterDrawerButton from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageFilterDrawerButton';
import type { NonRAQIUIFilterDimension } from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/filterUtils';
import type { CreatorAnalyticsUntabbedPageConfig } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import styles from './DashboardCanvasControlBar.module.css';

type DashboardCanvasControlBarProps = {
  readonly pageConfig: CreatorAnalyticsUntabbedPageConfig;
};

const NO_LEGACY_FILTER_DIMENSIONS: ReadonlyArray<NonRAQIUIFilterDimension> = [];
const PREDEFINED_SURFACE_CONTROL_OPTIONS = {
  useFoundationDateRangeControl: true,
  hidePartialGranularitySupportDescription: true,
} as const;
const DASHBOARD_CONTROL_GROUP_CLASSES = 'flex flex-row wrap gap-medium';
const DASHBOARD_CONTROL_SLOT_CLASSES = 'flex flex-col justify-end shrink-0';
const DASHBOARD_DATE_RANGE_CONTROL_SLOT_CLASSES = 'flex flex-col shrink-0 width-[220px]';

const DashboardCanvasControlBar: FC<DashboardCanvasControlBarProps> = ({ pageConfig }) => {
  const { leftSideControls, rightSideControls, filterDimensions, chartContext } =
    useRAQIV2PredefinedSurfaceControlsBundle(pageConfig, PREDEFINED_SURFACE_CONTROL_OPTIONS);
  const filterDrawerDimensions = useMemo<TSupportedFilterBarDimensions[]>(
    () =>
      Array.from(
        new Set(
          filterDimensions.flatMap((dimension) => {
            const filterDimension = getFilterBarDimensionForRAQIV2Dimension(dimension);
            return filterDimension ? [filterDimension] : [];
          }),
        ),
      ),
    [filterDimensions],
  );
  const { filters, onFiltersChange } = useMixedAnalyticsCurrentFilterBundle(
    NO_LEGACY_FILTER_DIMENSIONS,
    filterDimensions,
  );
  const filterControl =
    filterDrawerDimensions.length > 0 ? (
      <div key='filter-button' className={DASHBOARD_CONTROL_SLOT_CLASSES}>
        <ExperienceAnalyticsPageFilterDrawerButton
          resource={chartContext.resource}
          dimensions={filterDrawerDimensions}
          filters={filters}
          onFiltersChange={onFiltersChange}
          triggerVariant='standard'
        />
      </div>
    ) : null;
  const hasAny =
    leftSideControls.length > 0 || filterControl !== null || rightSideControls.length > 0;
  if (!hasAny) {
    return null;
  }
  return (
    <div className={styles.dashboardControlBar}>
      <div className={DASHBOARD_CONTROL_GROUP_CLASSES}>
        {leftSideControls.map((control) => (
          <div
            key={control.key}
            className={
              control.key === 'date'
                ? DASHBOARD_DATE_RANGE_CONTROL_SLOT_CLASSES
                : DASHBOARD_CONTROL_SLOT_CLASSES
            }>
            {control}
          </div>
        ))}
        {filterControl}
      </div>
      <div className={DASHBOARD_CONTROL_GROUP_CLASSES}>
        {rightSideControls.map((control) => (
          <div key={control.key} className={DASHBOARD_CONTROL_SLOT_CLASSES}>
            {control}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardCanvasControlBar;
