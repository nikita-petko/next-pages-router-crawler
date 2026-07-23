import type { FC } from 'react';
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button as FoundationButton } from '@rbx/foundation-ui';
import { Grid } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useImpressionObserver from '@modules/charts-generic/charts/hooks/useImpressionObserver';
import FilterDrawer from '@modules/charts-generic/components/FilterDrawer/FilterDrawer';
import FilterDrawerButton from '@modules/charts-generic/components/FilterDrawer/FilterDrawerButton';
import { FilterDrawerGroup } from '@modules/charts-generic/components/FilterDrawer/FilterDrawerGroup';
import type { RAQIV2ChartResource } from '@modules/clients/analytics';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import getAppLayoutContentContainerElement from '@modules/navigation/utils/getAppLayoutContentContainerElement';
import { codegenGroupDimensionsByCategoryInOrder } from '../../constants/codegenFilterGroupConfig';
import type { TSupportedFilterBarDimensions } from '../../constants/FilterDimensionConfig';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import {
  logFilterDrawerButtonClick,
  logFilterDrawerButtonImpression,
} from '../../logging/experienceAnalyticsUnifiedLogger';
import type { LoggingTarget } from '../../logging/LoggingTarget';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';
import ExperienceAnalyticsPageFilterChoice from './ExperienceAnalyticsPageFilterChoice';
import type { UIFilters } from './filterUtils';
import { clearDependentFiltersOnDimensionChange, updateFilterValues } from './filterUtils';

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
    classes: { controlBarFilter, foundationControlBarFilter },
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
      filtersOnSubmitRef.current = clearDependentFiltersOnDimensionChange(
        updateFilterValues(filtersOnSubmitRef.current, dimension, newFilterValue),
        dimension,
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

  const foundationButton = (
    <FoundationButton
      variant={triggerVariant === 'standard' ? 'Standard' : 'Utility'}
      size={triggerVariant === 'standard' ? 'Medium' : 'Small'}
      icon={triggerVariant === 'standard' ? undefined : 'icon-filled-plus-large'}
      onClick={openDrawer}>
      {triggerLabel ?? translate(translationKey('Action.FilterBy', TranslationNamespace.Analytics))}
    </FoundationButton>
  );

  return (
    <Grid
      item
      // The control-bar 'default' variant keeps the shared gutter margin on the
      // Grid item. 'standard' carries its own gutter on the spacer wrapper below
      // (so it aligns with the labelled controls), and 'utilityPlus' is inline
      // and manages its own spacing.
      className={triggerVariant === 'default' ? controlBarFilter : undefined}
      onClick={() => logFilterButtonClick()}>
      {triggerVariant === 'utilityPlus' || triggerVariant === 'standard' ? (
        <>
          {triggerVariant === 'standard' ? (
            // The adjacent control-bar controls render a label above the input,
            // and the row is vertically centered. Mirror that label + control
            // stack with an invisible spacer so the button bottom-aligns with
            // the neighbouring dropdowns instead of floating to the middle.
            <div className={`flex flex-col gap-small items-start ${foundationControlBarFilter}`}>
              <span aria-hidden='true' className='text-title-medium content-emphasis'>
                &nbsp;
              </span>
              {foundationButton}
            </div>
          ) : (
            foundationButton
          )}
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
        </>
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
