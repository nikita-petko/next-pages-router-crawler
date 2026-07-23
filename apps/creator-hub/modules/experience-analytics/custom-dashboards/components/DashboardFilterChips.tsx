import { type FC, useMemo } from 'react';
import {
  getFilterBarDimensionForRAQIV2Dimension,
  type TSupportedFilterBarDimensions,
} from '@modules/experience-analytics-shared/constants/FilterDimensionConfig';
import ExperienceAnalyticsFilterChips from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsFilterChips';
import type { CreatorAnalyticsUntabbedPageConfig } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';

type DashboardFilterChipsProps = {
  readonly pageConfig: CreatorAnalyticsUntabbedPageConfig;
};

const DashboardFilterChips: FC<DashboardFilterChipsProps> = ({ pageConfig }) => {
  const filterChipDimensions = useMemo<TSupportedFilterBarDimensions[]>(
    () =>
      Array.from(
        new Set(
          pageConfig.filterDimensions.flatMap((dimension) => {
            const filterDimension = getFilterBarDimensionForRAQIV2Dimension(dimension);
            return filterDimension ? [filterDimension] : [];
          }),
        ),
      ),
    [pageConfig.filterDimensions],
  );

  if (filterChipDimensions.length === 0) {
    return null;
  }

  return <ExperienceAnalyticsFilterChips dimensions={filterChipDimensions} />;
};

export default DashboardFilterChips;
