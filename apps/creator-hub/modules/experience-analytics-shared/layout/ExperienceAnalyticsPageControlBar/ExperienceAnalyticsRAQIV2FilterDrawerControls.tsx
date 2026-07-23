import React, { useCallback, useMemo } from 'react';
import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import { Grid } from '@rbx/ui';
import { RAQIV2ChartResource } from '@modules/clients/analytics';
import { RAQIV2Dimension, TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import filterPositionOnPageByDimension from '../../utils/filterPositionOnPageByDimension';
import { useAnalyticsCurrentFilterBundle } from '../../context/AnalyticsCurrentFilterBundleProvider';
import {
  OptionType,
  TSupportedFilterBarDimensions,
  getFilterBarDimensionForRAQIV2Dimension,
  getRAQIOrLegacyFilterConfig,
  nonRAQISupportedFilterBarDimensions,
  raqiSupportedFilterBarDimensions,
} from '../../constants/FilterDimensionConfig';
import ExperienceAnalyticsPageControlBar, {
  ExperienceAnalyticsPageControl,
} from './ExperienceAnalyticsPageControlBar';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';
import { FilterBarControlProps } from './ExperienceAnalyticsPageFilterBarControl';
import ExperienceAnalyticsPageFilterChoice from './ExperienceAnalyticsPageFilterChoice';
import { updateFilterValues, updateFilterSingleValue, NonRAQIUIDimension } from './filterUtils';
import ExperienceAnalyticsFilterChips from '../ExperienceAnalyticsFilterChips';
import ExperienceAnalyticsRAQIV2RightSideControls from './ExperienceAnalyticsRAQIV2RightSideControls';
import ExperienceAnalyticsPageFilterDrawerButton from './ExperienceAnalyticsPageFilterDrawerButton';
import RAQIV2FilterRenderPosition from '../../types/RAQIV2FilterRenderPosition';

type ExperienceAnalyticsFilterDrawerControlsProps = {
  controls: Array<ExperienceAnalyticsPageControl>;
  rightSideControls?: Array<ExperienceAnalyticsPageControl>;

  /** filterDimensions are meant to replace filterBar eventually */
  filterBar?: FilterBarControlProps;
  filterDimensions?: Readonly<NonRAQIUIDimension[]>;
  raqiDimensions?: ReadonlyArray<TRAQIV2Dimension>;
  resource?: RAQIV2ChartResource;
};

const getFilterDimensionsByPosition = (
  filterDimensions?: Readonly<TSupportedFilterBarDimensions[]>,
): Record<RAQIV2FilterRenderPosition, Array<TSupportedFilterBarDimensions>> => {
  const dimensionsByPosition: Record<
    RAQIV2FilterRenderPosition,
    Array<TSupportedFilterBarDimensions>
  > = {
    [RAQIV2FilterRenderPosition.FilterDrawer]: [],
    [RAQIV2FilterRenderPosition.Controls]: [],
    [RAQIV2FilterRenderPosition.ControlsRight]: [],
    [RAQIV2FilterRenderPosition.PreControl]: [],
  };

  filterDimensions?.forEach((dim) => {
    if (
      !isValidArrayEnumValue(raqiSupportedFilterBarDimensions, dim) &&
      !isValidArrayEnumValue(nonRAQISupportedFilterBarDimensions, dim)
    ) {
      return;
    }

    const position = filterPositionOnPageByDimension(dim);
    dimensionsByPosition[position].push(dim);
  });

  return dimensionsByPosition;
};

const ExperienceAnalyticsRAQIV2FilterDrawerControls = ({
  controls,
  rightSideControls: givenRightSideControls,
  filterBar,
  filterDimensions: legacyFilterDimensions,
  raqiDimensions,
  resource,
}: ExperienceAnalyticsFilterDrawerControlsProps) => {
  if ((legacyFilterDimensions || raqiDimensions) && !resource) {
    throw new Error(
      'ExperienceAnalyticsRAQIV2FilterDrawerControls: resource is required when filterDimensions is provided',
    );
  }

  const {
    classes: { controlBarFilter },
  } = useAnalyticsPageControlBarStyles();

  // eslint-disable-next-line deprecation/deprecation -- still transitioning
  const { filters, onFiltersChange } = useAnalyticsCurrentFilterBundle(
    legacyFilterDimensions ?? [],
    raqiDimensions,
  );

  const filterDimensions: TSupportedFilterBarDimensions[] = useMemo(() => {
    const fd = [
      ...(raqiDimensions ?? []).flatMap(
        (dim) => getFilterBarDimensionForRAQIV2Dimension(dim) || [],
      ),
      ...(legacyFilterDimensions ?? []).filter((dim) =>
        isValidArrayEnumValue(nonRAQISupportedFilterBarDimensions, dim),
      ),
    ];

    // dedupe filter dimensions obtained from raqi and legacy filter dimensions
    return Array.from(new Set(fd));
  }, [legacyFilterDimensions, raqiDimensions]);

  const {
    [RAQIV2FilterRenderPosition.FilterDrawer]: filterDimensionsInDrawer,
    [RAQIV2FilterRenderPosition.Controls]: filterDimensionsInControls,
    [RAQIV2FilterRenderPosition.ControlsRight]: filterDimensionsInControlsRight,
    [RAQIV2FilterRenderPosition.PreControl]: filterDimensionsInPreControls,
  } = useMemo(() => getFilterDimensionsByPosition(filterDimensions), [filterDimensions]);

  const raqiFilterDimensionsShownElsewhere = useMemo(() => {
    return [
      ...filterDimensionsInControls,
      ...filterDimensionsInControlsRight,
      ...filterDimensionsInPreControls,
    ]
      .map((dim) => {
        const config = getRAQIOrLegacyFilterConfig(dim);
        switch (config.optionType) {
          case OptionType.RAQIV2DynamicEnum:
          case OptionType.RAQIV2StaticEnum:
            return config.raqiDimension;
          case OptionType.Legacy:
            return null;
          default: {
            const exhaustiveCheck: never = config;
            throw new Error(`Unhandled option type ${exhaustiveCheck}`);
          }
        }
      })
      .filter((x): x is TRAQIV2Dimension => x !== null);
  }, [filterDimensionsInControls, filterDimensionsInControlsRight, filterDimensionsInPreControls]);

  const onFilterValueChange = useCallback(
    (newFilterValue: string[] | null, dimension: TSupportedFilterBarDimensions) => {
      let updatedFilters = updateFilterValues(filters, dimension, newFilterValue);
      // reset place version filter when place is changed
      if (dimension === RAQIV2Dimension.Place) {
        updatedFilters = updateFilterSingleValue(updatedFilters, NonRAQIUIDimension.Version, null);
      }
      onFiltersChange(updatedFilters);
    },
    [filters, onFiltersChange],
  );

  const updatedControls = useMemo(() => {
    const updates = [...controls];
    if (filterDimensionsInControls.length && resource) {
      updates.push(
        ...filterDimensionsInControls.map((dimension) => (
          <Grid item key={dimension} className={controlBarFilter}>
            <ExperienceAnalyticsPageFilterChoice
              resource={resource}
              filterBarDimension={dimension}
              uiFilters={filters}
              onUIFilterValueChange={onFilterValueChange}
            />
          </Grid>
        )),
      );
    }

    if (filterDimensionsInDrawer.length && resource) {
      updates.push(
        <ExperienceAnalyticsPageFilterDrawerButton
          key='filter-button'
          resource={resource}
          dimensions={filterDimensionsInDrawer}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />,
      );
    }

    return updates;
  }, [
    controlBarFilter,
    controls,
    filterDimensionsInControls,
    filterDimensionsInDrawer,
    filters,
    onFilterValueChange,
    onFiltersChange,
    resource,
  ]);

  const rightSideControls = useMemo(() => {
    const updates: ExperienceAnalyticsPageControl[] = [];
    if (filterDimensionsInControlsRight.length && resource) {
      updates.push(
        ...filterDimensionsInControlsRight.map((dimension) => (
          <Grid item key={dimension} className={controlBarFilter}>
            <ExperienceAnalyticsPageFilterChoice
              resource={resource}
              filterBarDimension={dimension}
              uiFilters={filters}
              onUIFilterValueChange={onFilterValueChange}
            />
          </Grid>
        )),
      );
    }
    if (givenRightSideControls) {
      updates.push(...givenRightSideControls);
    }
    return updates;
  }, [
    controlBarFilter,
    filterDimensionsInControlsRight,
    filters,
    givenRightSideControls,
    onFilterValueChange,
    resource,
  ]);

  if (
    updatedControls.length === 0 &&
    rightSideControls.length === 0 &&
    filterDimensionsInDrawer?.length === 0 &&
    !filterBar
  ) {
    return null;
  }

  return (
    <Grid paddingBottom={1}>
      <Grid container justifyContent='space-between' alignItems='center'>
        <Grid item>
          <ExperienceAnalyticsPageControlBar controls={updatedControls} filterBar={filterBar} />
        </Grid>
        <Grid item>
          <ExperienceAnalyticsRAQIV2RightSideControls controls={rightSideControls} />
        </Grid>
      </Grid>
      <ExperienceAnalyticsFilterChips
        dimensions={filterDimensionsInDrawer}
        knownRAQIDimensionsShownElsewhere={raqiFilterDimensionsShownElsewhere}
      />
    </Grid>
  );
};

export default ExperienceAnalyticsRAQIV2FilterDrawerControls;
