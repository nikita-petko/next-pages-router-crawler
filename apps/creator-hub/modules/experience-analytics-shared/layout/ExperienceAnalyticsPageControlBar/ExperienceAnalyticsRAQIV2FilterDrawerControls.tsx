import { useCallback, useMemo } from 'react';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { Grid } from '@rbx/ui';
import type { ChartResource as RAQIV2ChartResource } from '@modules/clients/analytics/analyticsRAQIShared';
import { isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type { TSupportedFilterBarDimensions } from '../../constants/FilterDimensionConfig';
import {
  OptionType,
  getFilterBarDimensionForRAQIV2Dimension,
  getRAQIOrLegacyFilterConfig,
  nonRAQISupportedFilterBarDimensions,
  raqiSupportedFilterBarDimensions,
} from '../../constants/FilterDimensionConfig';
import { useMixedAnalyticsCurrentFilterBundle } from '../../context/AnalyticsCurrentFilterBundleProvider';
import RAQIV2FilterRenderPosition from '../../types/RAQIV2FilterRenderPosition';
import type { FilterPositionOverrides } from '../../utils/filterPositionOnPageByDimension';
import filterPositionOnPageByDimension from '../../utils/filterPositionOnPageByDimension';
import ExperienceAnalyticsFilterChips from '../ExperienceAnalyticsFilterChips';
import type { ExperienceAnalyticsPageControl } from './ExperienceAnalyticsPageControlBar';
import ExperienceAnalyticsPageControlBar from './ExperienceAnalyticsPageControlBar';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';
import type { FilterBarControlProps } from './ExperienceAnalyticsPageFilterBarControl';
import ExperienceAnalyticsPageFilterChoice from './ExperienceAnalyticsPageFilterChoice';
import ExperienceAnalyticsPageFilterDrawerButton from './ExperienceAnalyticsPageFilterDrawerButton';
import ExperienceAnalyticsRAQIV2RightSideControls from './ExperienceAnalyticsRAQIV2RightSideControls';
import { clearDependentFiltersOnDimensionChange, updateFilterValues } from './filterUtils';
import type { NonRAQIUIDimension } from './filterUtils';

type ExperienceAnalyticsFilterDrawerControlsProps = {
  controls: Array<ExperienceAnalyticsPageControl>;
  rightSideControls?: Array<ExperienceAnalyticsPageControl>;

  /** filterDimensions are meant to replace filterBar eventually */
  filterBar?: FilterBarControlProps;
  filterDimensions?: Readonly<NonRAQIUIDimension[]>;
  raqiDimensions?: ReadonlyArray<TRAQIV2Dimension>;
  resource?: RAQIV2ChartResource;
  /** Per-page overrides for which RAQIV2FilterRenderPosition each dimension renders into. */
  filterPositionOverrides?: FilterPositionOverrides;
};

const getFilterDimensionsByPosition = (
  filterDimensions?: Readonly<TSupportedFilterBarDimensions[]>,
  overrides?: FilterPositionOverrides,
): Record<RAQIV2FilterRenderPosition, Array<TSupportedFilterBarDimensions>> => {
  const dimensionsByPosition: Record<
    RAQIV2FilterRenderPosition,
    Array<TSupportedFilterBarDimensions>
  > = {
    [RAQIV2FilterRenderPosition.FilterDrawer]: [],
    [RAQIV2FilterRenderPosition.Controls]: [],
    [RAQIV2FilterRenderPosition.ControlsRight]: [],
    [RAQIV2FilterRenderPosition.ControlsRow2]: [],
    [RAQIV2FilterRenderPosition.PreControl]: [],
  };

  filterDimensions?.forEach((dim) => {
    if (
      !isValidArrayEnumValue(raqiSupportedFilterBarDimensions, dim) &&
      !isValidArrayEnumValue(nonRAQISupportedFilterBarDimensions, dim)
    ) {
      return;
    }

    const position = filterPositionOnPageByDimension(dim, overrides);
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
  filterPositionOverrides,
}: ExperienceAnalyticsFilterDrawerControlsProps) => {
  if ((legacyFilterDimensions || raqiDimensions) && !resource) {
    throw new Error(
      'ExperienceAnalyticsRAQIV2FilterDrawerControls: resource is required when filterDimensions is provided',
    );
  }

  const {
    classes: { foundationControlBarSelector },
  } = useAnalyticsPageControlBarStyles();

  const { filters, onFiltersChange } = useMixedAnalyticsCurrentFilterBundle(
    legacyFilterDimensions ?? [],
    raqiDimensions,
  );

  const filterDimensions: TSupportedFilterBarDimensions[] = useMemo(() => {
    const fd = [
      ...(raqiDimensions ?? []).flatMap(
        (dim) => getFilterBarDimensionForRAQIV2Dimension(dim) ?? [],
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
    [RAQIV2FilterRenderPosition.ControlsRow2]: filterDimensionsInControlsRow2,
    [RAQIV2FilterRenderPosition.PreControl]: filterDimensionsInPreControls,
  } = useMemo(
    () => getFilterDimensionsByPosition(filterDimensions, filterPositionOverrides),
    [filterDimensions, filterPositionOverrides],
  );

  const raqiFilterDimensionsShownElsewhere = useMemo(() => {
    return [
      ...filterDimensionsInControls,
      ...filterDimensionsInControlsRight,
      ...filterDimensionsInControlsRow2,
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
            throw new Error(`Unhandled option type ${String(exhaustiveCheck)}`);
          }
        }
      })
      .filter((x): x is TRAQIV2Dimension => x !== null);
  }, [
    filterDimensionsInControls,
    filterDimensionsInControlsRight,
    filterDimensionsInControlsRow2,
    filterDimensionsInPreControls,
  ]);

  const onFilterValueChange = useCallback(
    (newFilterValue: string[] | null, dimension: TSupportedFilterBarDimensions) => {
      const updatedFilters = clearDependentFiltersOnDimensionChange(
        updateFilterValues(filters, dimension, newFilterValue),
        dimension,
      );
      onFiltersChange(updatedFilters);
    },
    [filters, onFiltersChange],
  );

  const updatedControls = useMemo(() => {
    const updates = [...controls];
    if (filterDimensionsInControls.length && resource) {
      updates.push(
        ...filterDimensionsInControls.map((dimension) => (
          <Grid item key={dimension}>
            <ExperienceAnalyticsPageFilterChoice
              resource={resource}
              filterBarDimension={dimension}
              uiFilters={filters}
              onUIFilterValueChange={onFilterValueChange}
              className={foundationControlBarSelector}
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
          triggerVariant='standard'
        />,
      );
    }

    return updates;
  }, [
    foundationControlBarSelector,
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
          <Grid item key={dimension}>
            <ExperienceAnalyticsPageFilterChoice
              resource={resource}
              filterBarDimension={dimension}
              uiFilters={filters}
              onUIFilterValueChange={onFilterValueChange}
              className={foundationControlBarSelector}
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
    foundationControlBarSelector,
    filterDimensionsInControlsRight,
    filters,
    givenRightSideControls,
    onFilterValueChange,
    resource,
  ]);

  const row2Controls = useMemo(() => {
    const updates: ExperienceAnalyticsPageControl[] = [];
    if (filterDimensionsInControlsRow2.length && resource) {
      updates.push(
        ...filterDimensionsInControlsRow2.map((dimension) => (
          <Grid item key={dimension}>
            <ExperienceAnalyticsPageFilterChoice
              resource={resource}
              filterBarDimension={dimension}
              uiFilters={filters}
              onUIFilterValueChange={onFilterValueChange}
              className={foundationControlBarSelector}
            />
          </Grid>
        )),
      );
    }
    return updates;
  }, [
    foundationControlBarSelector,
    filterDimensionsInControlsRow2,
    filters,
    onFilterValueChange,
    resource,
  ]);

  if (
    updatedControls.length === 0 &&
    rightSideControls.length === 0 &&
    row2Controls.length === 0 &&
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
      {row2Controls.length > 0 && (
        <Grid container justifyContent='flex-start' direction='row' spacing={1} alignItems='center'>
          {row2Controls}
        </Grid>
      )}
      <ExperienceAnalyticsFilterChips
        dimensions={filterDimensionsInDrawer}
        knownRAQIDimensionsShownElsewhere={raqiFilterDimensionsShownElsewhere}
      />
    </Grid>
  );
};

export default ExperienceAnalyticsRAQIV2FilterDrawerControls;
