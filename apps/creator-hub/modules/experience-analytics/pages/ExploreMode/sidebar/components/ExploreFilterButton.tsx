import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@rbx/foundation-ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import FilterDrawer from '@modules/charts-generic/components/FilterDrawer/FilterDrawer';
import { FilterDrawerGroup } from '@modules/charts-generic/components/FilterDrawer/FilterDrawerGroup';
import type { RAQIV2ChartResource } from '@modules/clients/analytics';
import { codegenGroupDimensionsByCategoryInOrder } from '@modules/experience-analytics-shared/constants/codegenFilterGroupConfig';
import type { TSupportedFilterBarDimensions } from '@modules/experience-analytics-shared/constants/FilterDimensionConfig';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import ExperienceAnalyticsPageFilterChoice from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageFilterChoice';
import {
  updateFilterValues,
  type UIFilters,
} from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/filterUtils';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import getAppLayoutContentContainerElement from '@modules/navigation/utils/getAppLayoutContentContainerElement';

type ExplorePageFilterButtonProps = {
  resource: RAQIV2ChartResource;
  dimensions: readonly TSupportedFilterBarDimensions[];
  filters: UIFilters;
  onFiltersChange: (filters: UIFilters) => void;
  /**
   * Called when the user clicks "Reset All" in the drawer. Expected to clear
   * every filter (supported + orphan) from the URL. The drawer will be closed
   * immediately after this fires.
   */
  onResetAllFilters?: () => void;
};

const ExplorePageFilterButton: FC<ExplorePageFilterButtonProps> = ({
  resource,
  dimensions,
  filters,
  onFiltersChange,
  onResetAllFilters,
}) => {
  const { translate, tPendingTranslation } = useRAQIV2TranslationDependencies();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const handleToggleDrawer = useCallback(() => setIsDrawerOpen((prev) => !prev), []);

  const pendingFiltersRef = useRef(filters);
  // if prop changes, blow away the pending filters
  useEffect(() => {
    pendingFiltersRef.current = filters;
  }, [filters]);

  const handleClose = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);
  // Reset All in Explore Mode acts as an immediate "clear everything and close"
  // action rather than the default pending-state clear. The callback clears
  // every filter (supported + orphan) in one URL update; we close right after.
  const handleResetAll = useCallback(() => {
    onResetAllFilters?.();
    setIsDrawerOpen(false);
  }, [onResetAllFilters]);

  const onFilterValueChange = useCallback(
    (newFilterValue: string[] | null, dimension: TSupportedFilterBarDimensions) => {
      pendingFiltersRef.current = updateFilterValues(
        pendingFiltersRef.current,
        dimension,
        newFilterValue,
      );
      onFiltersChange(pendingFiltersRef.current);
    },
    [onFiltersChange],
  );

  const filterDrawerContent = useMemo(() => {
    const groupedDimensions = codegenGroupDimensionsByCategoryInOrder(dimensions);
    return Array.from(groupedDimensions.entries()).map(
      ([mapKey, { groupKey, dimensions: dimensionsInOrder }]) => {
        const groupName = translate(groupKey);
        return (
          <FilterDrawerGroup name={groupName} key={mapKey}>
            {dimensionsInOrder.map((dimension) => (
              <ExperienceAnalyticsPageFilterChoice
                resource={resource}
                key={dimension}
                filterBarDimension={dimension}
                uiFilters={filters}
                onUIFilterValueChange={onFilterValueChange}
              />
            ))}
          </FilterDrawerGroup>
        );
      },
    );
  }, [dimensions, filters, onFilterValueChange, resource, translate]);

  const buttonLabel = tPendingTranslation(
    'Filter by',
    'text for filter drawer button on experience analytics pages',
    translationKey('Action.FilterBy', TranslationNamespace.Analytics),
  );
  const drawerTitle = tPendingTranslation(
    'Filter by category',
    'title for filter drawer',
    translationKey('Description.FilterDrawer.FilterByCategory', TranslationNamespace.Analytics),
  );

  return (
    <>
      <Button variant='Standard' size='Medium' onClick={handleToggleDrawer}>
        {buttonLabel}
      </Button>
      {createPortal(
        <FilterDrawer
          title={drawerTitle}
          open={isDrawerOpen}
          onClose={handleClose}
          onResetAll={handleResetAll}>
          {filterDrawerContent}
        </FilterDrawer>,
        getAppLayoutContentContainerElement() ?? document.body,
      )}
    </>
  );
};

export default ExplorePageFilterButton;
