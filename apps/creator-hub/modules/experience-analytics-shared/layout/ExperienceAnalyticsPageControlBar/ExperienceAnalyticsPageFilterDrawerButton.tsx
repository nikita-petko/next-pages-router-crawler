import React, { FC, memo, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  FilterDrawerButton,
  FilterDrawer,
  FilterDrawerGroup,
  useImpressionObserver,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import getAppLayoutContentContainerElement from '@modules/navigation/utils/getAppLayoutContentContainerElement';
import { Grid } from '@rbx/ui';
import { Button as FoundationButton } from '@rbx/foundation-ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RAQIV2ChartResource } from '@modules/clients/analytics';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { createPortal } from 'react-dom';
import { codegenGroupDimensionsByCategoryInOrder } from '../../constants/codegenFilterGroupConfig';
import {
  logFilterDrawerButtonClick,
  logFilterDrawerButtonImpression,
} from '../../logging/experienceAnalyticsUnifiedLogger';
import { LoggingTarget } from '../../logging/LoggingTarget';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';

import { UIFilters, updateFilterValues } from './filterUtils';
import { TSupportedFilterBarDimensions } from '../../constants/FilterDimensionConfig';
import ExperienceAnalyticsPageFilterChoice from './ExperienceAnalyticsPageFilterChoice';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';

type ExperienceAnalyticsFilterDrawerButtonProps = {
  resource: RAQIV2ChartResource;
  dimensions: readonly TSupportedFilterBarDimensions[];
  filters: UIFilters;
  onFiltersChange: (filters: UIFilters) => void;
  loggingTarget?: LoggingTarget;
  triggerVariant?: 'default' | 'utilityPlus' | 'standard';
  triggerLabel?: string;
};

const ExperienceAnalyticsFilterDrawerButton: FC<ExperienceAnalyticsFilterDrawerButtonProps> = ({
  resource,
  dimensions,
  filters,
  onFiltersChange,
  loggingTarget,
  triggerVariant = 'default',
  triggerLabel,
}) => {
  const {
    classes: { controlBarFilter },
  } = useAnalyticsPageControlBarStyles();
  const { translate } = useRAQIV2TranslationDependencies();

  // Sync filter outside of the drawer. So when submit changes,
  // all filters in and outside of drawers can be combined
  const filtersOnSubmitRef = useRef(filters);
  useEffect(() => {
    filtersOnSubmitRef.current = filters;
  }, [filters]);

  const onFilterValueChange = useCallback(
    (newFilterValue: string[] | null, dimension: TSupportedFilterBarDimensions) => {
      filtersOnSubmitRef.current = updateFilterValues(
        filtersOnSubmitRef.current,
        dimension,
        newFilterValue,
      );
      onFiltersChange(filtersOnSubmitRef.current);
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

  const { unifiedLogger } = useUnifiedLoggerProvider();
  const logFilterButtonClick = useCallback(() => {
    logFilterDrawerButtonClick(unifiedLogger, { loggingTarget });
  }, [loggingTarget, unifiedLogger]);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);
  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const buttonRef = useRef<HTMLDivElement>(null);
  const sendImpressionEvent = useCallback(() => {
    logFilterDrawerButtonImpression(unifiedLogger, { loggingTarget });
  }, [unifiedLogger, loggingTarget]);
  useImpressionObserver(buttonRef, sendImpressionEvent);

  return (
    <Grid
      item
      className={triggerVariant === 'default' ? controlBarFilter : undefined}
      onClick={() => logFilterButtonClick()}>
      {triggerVariant === 'utilityPlus' || triggerVariant === 'standard' ? (
        <React.Fragment>
          <FoundationButton
            variant={triggerVariant === 'standard' ? 'Standard' : 'Utility'}
            size={triggerVariant === 'standard' ? 'Medium' : 'Small'}
            icon={triggerVariant === 'standard' ? undefined : 'icon-filled-plus-large'}
            onClick={openDrawer}>
            {triggerLabel ||
              translate(translationKey('Action.FilterBy', TranslationNamespace.Analytics))}
          </FoundationButton>
          {createPortal(
            <FilterDrawer
              title={translate(
                translationKey(
                  'Description.FilterDrawer.FilterByCategory',
                  TranslationNamespace.Analytics,
                ),
              )}
              open={isDrawerOpen}
              onClose={closeDrawer}>
              {filterDrawerContent}
            </FilterDrawer>,
            getAppLayoutContentContainerElement() ?? document.body,
          )}
        </React.Fragment>
      ) : (
        <FilterDrawerButton
          getDrawerContainer={getAppLayoutContentContainerElement}
          buttonLabel={translate(translationKey('Action.FilterBy', TranslationNamespace.Analytics))}
          drawerTitle={translate(
            translationKey(
              'Description.FilterDrawer.FilterByCategory',
              TranslationNamespace.Analytics,
            ),
          )}
          filterDrawerContent={filterDrawerContent}
        />
      )}
    </Grid>
  );
};

export default memo(ExperienceAnalyticsFilterDrawerButton);
