import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FilterDrawer, FilterDrawerGroup } from '@modules/charts-generic';
import { Button } from '@rbx/foundation-ui';
import { RAQIV2ChartResource } from '@modules/clients/analytics';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import getAppLayoutContentContainerElement from '@modules/navigation/utils/getAppLayoutContentContainerElement';
import {
  ExperienceAnalyticsPageFilterChoice,
  codegenGroupDimensionsByCategoryInOrder,
  updateFilterValues,
  useRAQIV2TranslationDependencies,
  type UIFilters,
  type TSupportedFilterBarDimensions,
} from '@modules/experience-analytics-shared';

type ExplorePageFilterButtonProps = {
  resource: RAQIV2ChartResource;
  dimensions: readonly TSupportedFilterBarDimensions[];
  filters: UIFilters;
  onFiltersChange: (filters: UIFilters) => void;
};

const ExplorePageFilterButton: FC<ExplorePageFilterButtonProps> = ({
  resource,
  dimensions,
  filters,
  onFiltersChange,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const pendingFiltersRef = useRef(filters);
  // if prop changes, blow away the pending filters
  useEffect(() => {
    pendingFiltersRef.current = filters;
  }, [filters]);

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

  const buttonLabel = translate(translationKey('Action.FilterBy', TranslationNamespace.Analytics));
  const drawerTitle = translate(
    translationKey('Description.FilterDrawer.FilterByCategory', TranslationNamespace.Analytics),
  );

  return (
    <React.Fragment>
      <Button variant='Standard' size='Medium' onClick={() => setIsDrawerOpen(true)}>
        {buttonLabel}
      </Button>
      {createPortal(
        <FilterDrawer
          title={drawerTitle}
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}>
          {filterDrawerContent}
        </FilterDrawer>,
        getAppLayoutContentContainerElement() ?? document.body,
      )}
    </React.Fragment>
  );
};

export default ExplorePageFilterButton;
