import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SelectionCallback } from '@rbx/analytics-ui';
import { subDays } from '@rbx/core';
import {
  RAQIV2AggregationType,
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2PercentileType,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import { Button, Grid } from '@rbx/ui';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import dateRangeOffsetDays from '@modules/charts-generic/constants/dateRangeOffsetDays';
import type { ChartLocation } from '@modules/charts-generic/context/ChartLocation';
import type { RAQIV2APIQueryFilter, RAQIV2QueryFilter } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type { RAQIV2SummarySpec } from '../../../adapters/genericRAQIV2ChartSummaryAdapter';
import { minimalDateForQuerying } from '../../../constants/analyticsMetadata';
import { isFilterableDimension } from '../../../constants/FilterDimensionConfig';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import type { RAQIV2ChartUpdatePolicy } from '../../../types/GenericRAQIV2ChartProps';
import type RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import type { SpecOverride } from '../../../utils/computeRAQIV2SpecOverride';
import computeRAQIV2SpecOverride from '../../../utils/computeRAQIV2SpecOverride';
import getTypedComponentKey from '../../../utils/getTypedComponentKey';
import DateRangeControl from '../../DateRangeControl';
import AnalyticsConfigChartPlaceholder, {
  AnalyticsConfigChartPlaceholderState,
} from '../AnalyticsConfigChartPlaceholder';
import RecursiveAnalyticsComponent from '../layout/RecursiveAnalyticsComponent';
import type {
  RAQIV2TimeRangeOverrideSubcontextConfig,
  RAQIV2DimensionFilterAndBreakdownOverrideSubcontextConfig,
  RAQIV2DimensionFilterAndBreakdownOverrideConfig,
} from './RAQIV2ControlledSubcontextConfig';
import {
  RAQIV2ControlledSubcontextType,
  RAQIV2DefaultFilterDimensionValueMode,
  RAQIV2TimeRangeControlMode,
} from './RAQIV2ControlledSubcontextConfig';
import useRAQIV2ControlledSubcontextSelectionStore from './RAQIV2ControlledSubcontextSelectionContext';
import RAQIV2PredefinedSubcontextControl, {
  useRAQIV2PredefinedSubcontextControlChoiceBundle,
  useStyles,
} from './RAQIV2PredefinedSubcontextControl';
import type { RAQIV2PredefinedSubcontextControlChoiceBundle } from './RAQIV2PredefinedSubcontextControl';
import type { RAQIV2PredefinedControlledSubcontextProps } from './types';

type SharedProps = {
  chartContext: RAQIV2ChartContext;
  onSelectChartRegion?: null | SelectionCallback<number>;
  chartLocation?: ChartLocation;
  chartUpdatePolicy?: RAQIV2ChartUpdatePolicy;
};

type DimensionFilterAndBreakdownOverrideControlledSubcontextProps = {
  config: RAQIV2DimensionFilterAndBreakdownOverrideSubcontextConfig;
} & SharedProps;

type PersistedSelections = string[][];

const initializeSelectedOptions = (
  controlConfigs: RAQIV2DimensionFilterAndBreakdownOverrideConfig[],
  choiceBundles: RAQIV2PredefinedSubcontextControlChoiceBundle[],
) => {
  return controlConfigs.map((config, controlIdx) => {
    const resolvedDefaultValue =
      config.defaultFilterDimensionValue ??
      (config.defaultFilterDimensionValueMode === RAQIV2DefaultFilterDimensionValueMode.LastOption
        ? choiceBundles[controlIdx]?.lastOption
        : undefined);
    return resolvedDefaultValue ? [resolvedDefaultValue] : [];
  });
};

const reconcilePersistedSelections = (
  persistedSelections: PersistedSelections | undefined,
  initialSelectedOptions: PersistedSelections,
  choiceBundles: RAQIV2PredefinedSubcontextControlChoiceBundle[],
) => {
  if (!persistedSelections) {
    return initialSelectedOptions;
  }

  return initialSelectedOptions.map((initialOptions, controlIdx) => {
    const previousOptions = persistedSelections[controlIdx] ?? [];
    const choiceBundle = choiceBundles[controlIdx];
    if (!choiceBundle) {
      return initialOptions;
    }

    const validOptions = previousOptions.filter((option) =>
      choiceBundle.enumOptions.includes(option),
    );
    const validOptionsWithPinnedDefaults = [
      ...validOptions,
      ...choiceBundle.pinnedOptions.filter((option) => !validOptions.includes(option)),
    ];

    return previousOptions.length > 0 && validOptionsWithPinnedDefaults.length === 0
      ? initialOptions
      : validOptionsWithPinnedDefaults;
  });
};

function DimensionFilterAndBreakdownOverrideControlledSubcontext({
  config,
  chartContext: givenChartContext,
  ...props
}: DimensionFilterAndBreakdownOverrideControlledSubcontextProps) {
  const { controlConfigs } = config;

  const controlConfigWithContextOverride = useMemo(
    () =>
      controlConfigs.map((controlConfig) => {
        const contextFilter = givenChartContext.filter?.find(
          (f) => f.dimension === controlConfig.filterDimension,
        );
        if (
          contextFilter &&
          contextFilter.values.length > 0 &&
          controlConfig.defaultFilterDimensionValue
        ) {
          return { ...controlConfig, defaultFilterDimensionValue: contextFilter.values[0] };
        }
        return controlConfig;
      }),
    [controlConfigs, givenChartContext.filter],
  );

  const dimensionValueScopingFilters = useMemo<readonly RAQIV2APIQueryFilter[] | undefined>(() => {
    const contextFilters = givenChartContext.filter;
    if (!contextFilters || contextFilters.length === 0) {
      return undefined;
    }
    const filters = contextFilters.filter(
      (filter): filter is RAQIV2APIQueryFilter =>
        filter.dimension !== RAQIV2UIPseudoDimension.AggregationType &&
        filter.dimension !== RAQIV2UIPseudoDimension.PercentileType,
    );
    return filters.length > 0 ? filters : undefined;
  }, [givenChartContext.filter]);

  const firstControlConfig = controlConfigWithContextOverride[0];
  if (!firstControlConfig) {
    return null;
  }

  const sharedProps = {
    config,
    chartContext: givenChartContext,
    dimensionValueScopingFilters,
    firstControlConfig,
    ...props,
  };
  const firstChoiceBundleKey = getChoiceBundleKey({
    body: config.body,
    resource: givenChartContext.resource,
    filterDimension: firstControlConfig.filterDimension,
    dimensionValueScopingFilters,
  });

  if (controlConfigWithContextOverride.length === 1) {
    return (
      <OneControlDimensionFilterAndBreakdownOverrideSubcontext
        key={firstChoiceBundleKey}
        {...sharedProps}
      />
    );
  }

  const secondControlConfig = controlConfigWithContextOverride[1];
  if (!secondControlConfig) {
    return null;
  }

  return (
    <TwoControlDimensionFilterAndBreakdownOverrideSubcontext
      key={JSON.stringify([
        firstChoiceBundleKey,
        getChoiceBundleKey({
          body: config.body,
          resource: givenChartContext.resource,
          filterDimension: secondControlConfig.filterDimension,
          dimensionValueScopingFilters,
        }),
      ])}
      {...sharedProps}
      secondControlConfig={secondControlConfig}
    />
  );
}

type ResolvedDimensionFilterAndBreakdownOverrideControlledSubcontextProps =
  DimensionFilterAndBreakdownOverrideControlledSubcontextProps & {
    choiceBundles: RAQIV2PredefinedSubcontextControlChoiceBundle[];
  };

type OneControlDimensionFilterAndBreakdownOverrideSubcontextProps = Omit<
  DimensionFilterAndBreakdownOverrideControlledSubcontextProps,
  'chartContext'
> & {
  chartContext: RAQIV2ChartContext;
  dimensionValueScopingFilters?: readonly RAQIV2APIQueryFilter[];
  firstControlConfig: RAQIV2DimensionFilterAndBreakdownOverrideConfig;
};

const shouldWaitForDefaultFilterDimensionValue = (
  controlConfig: RAQIV2DimensionFilterAndBreakdownOverrideConfig,
  choiceBundle: RAQIV2PredefinedSubcontextControlChoiceBundle,
) => {
  return (
    controlConfig.defaultFilterDimensionValueMode ===
      RAQIV2DefaultFilterDimensionValueMode.LastOption &&
    !controlConfig.defaultFilterDimensionValue &&
    choiceBundle.isDataLoading
  );
};

const resolvesLastOptionDefault = (
  controlConfig: RAQIV2DimensionFilterAndBreakdownOverrideConfig,
) =>
  controlConfig.defaultFilterDimensionValueMode ===
    RAQIV2DefaultFilterDimensionValueMode.LastOption && !controlConfig.defaultFilterDimensionValue;

const renderLastOptionPlaceholder = (
  body: RAQIV2DimensionFilterAndBreakdownOverrideSubcontextConfig['body'],
  chartContext: RAQIV2ChartContext,
  state: AnalyticsConfigChartPlaceholderState,
) => {
  const typedBody = getTypedComponentKey(body);
  return typedBody.type === AnalyticsComponentType.Chart ? (
    <AnalyticsConfigChartPlaceholder
      chartKeyOrConfig={typedBody.keyOrConfig}
      chartContext={chartContext}
      state={state}
    />
  ) : null;
};

const hasNoLastOption = (
  controlConfig: RAQIV2DimensionFilterAndBreakdownOverrideConfig,
  choiceBundle: RAQIV2PredefinedSubcontextControlChoiceBundle,
) =>
  resolvesLastOptionDefault(controlConfig) &&
  !choiceBundle.isDataLoading &&
  choiceBundle.lastOption === undefined;

const getChoiceBundleKey = ({
  body,
  resource,
  filterDimension,
  dimensionValueScopingFilters,
}: {
  body: RAQIV2DimensionFilterAndBreakdownOverrideSubcontextConfig['body'];
  resource: RAQIV2ChartContext['resource'];
  filterDimension: RAQIV2DimensionFilterAndBreakdownOverrideConfig['filterDimension'];
  dimensionValueScopingFilters?: readonly RAQIV2APIQueryFilter[];
}) =>
  JSON.stringify({
    body,
    resource,
    filterDimension,
    dimensionValueScopingFilters,
  });

function OneControlDimensionFilterAndBreakdownOverrideSubcontext({
  firstControlConfig,
  dimensionValueScopingFilters,
  config,
  chartContext,
  ...props
}: OneControlDimensionFilterAndBreakdownOverrideSubcontextProps) {
  const choiceBundle = useRAQIV2PredefinedSubcontextControlChoiceBundle({
    body: config.body,
    resource: chartContext.resource,
    filterDimension: firstControlConfig.filterDimension,
    defaultFilterDimensionValueMode: firstControlConfig.defaultFilterDimensionValueMode,
    pinDefaultFilterDimensionValue: firstControlConfig.pinDefaultFilterDimensionValue,
    dimensionValueScopingFilters,
  });
  const choiceBundles = useMemo(() => [choiceBundle], [choiceBundle]);

  const resolvedSubcontext = (
    <ResolvedDimensionFilterAndBreakdownOverrideControlledSubcontext
      config={config}
      chartContext={chartContext}
      choiceBundles={choiceBundles}
      {...props}
    />
  );

  if (resolvesLastOptionDefault(firstControlConfig)) {
    if (shouldWaitForDefaultFilterDimensionValue(firstControlConfig, choiceBundle)) {
      return renderLastOptionPlaceholder(
        config.body,
        chartContext,
        AnalyticsConfigChartPlaceholderState.Loading,
      );
    }
    return hasNoLastOption(firstControlConfig, choiceBundle)
      ? renderLastOptionPlaceholder(
          config.body,
          chartContext,
          AnalyticsConfigChartPlaceholderState.NoData,
        )
      : resolvedSubcontext;
  }

  return resolvedSubcontext;
}

type TwoControlDimensionFilterAndBreakdownOverrideSubcontextProps =
  OneControlDimensionFilterAndBreakdownOverrideSubcontextProps & {
    secondControlConfig: RAQIV2DimensionFilterAndBreakdownOverrideConfig;
  };

function TwoControlDimensionFilterAndBreakdownOverrideSubcontext({
  firstControlConfig,
  secondControlConfig,
  dimensionValueScopingFilters,
  config,
  chartContext,
  ...props
}: TwoControlDimensionFilterAndBreakdownOverrideSubcontextProps) {
  const firstChoiceBundle = useRAQIV2PredefinedSubcontextControlChoiceBundle({
    body: config.body,
    resource: chartContext.resource,
    filterDimension: firstControlConfig.filterDimension,
    defaultFilterDimensionValueMode: firstControlConfig.defaultFilterDimensionValueMode,
    pinDefaultFilterDimensionValue: firstControlConfig.pinDefaultFilterDimensionValue,
    dimensionValueScopingFilters,
  });
  const secondChoiceBundle = useRAQIV2PredefinedSubcontextControlChoiceBundle({
    body: config.body,
    resource: chartContext.resource,
    filterDimension: secondControlConfig.filterDimension,
    defaultFilterDimensionValueMode: secondControlConfig.defaultFilterDimensionValueMode,
    pinDefaultFilterDimensionValue: secondControlConfig.pinDefaultFilterDimensionValue,
    dimensionValueScopingFilters,
  });
  const choiceBundles = useMemo(
    () => [firstChoiceBundle, secondChoiceBundle],
    [firstChoiceBundle, secondChoiceBundle],
  );

  const resolvedSubcontext = (
    <ResolvedDimensionFilterAndBreakdownOverrideControlledSubcontext
      config={config}
      chartContext={chartContext}
      choiceBundles={choiceBundles}
      {...props}
    />
  );

  if (
    resolvesLastOptionDefault(firstControlConfig) ||
    resolvesLastOptionDefault(secondControlConfig)
  ) {
    const isWaitingForDefaultFilterDimensionValue =
      shouldWaitForDefaultFilterDimensionValue(firstControlConfig, firstChoiceBundle) ||
      shouldWaitForDefaultFilterDimensionValue(secondControlConfig, secondChoiceBundle);
    if (isWaitingForDefaultFilterDimensionValue) {
      return renderLastOptionPlaceholder(
        config.body,
        chartContext,
        AnalyticsConfigChartPlaceholderState.Loading,
      );
    }
    const isMissingDefaultFilterDimensionValue =
      hasNoLastOption(firstControlConfig, firstChoiceBundle) ||
      hasNoLastOption(secondControlConfig, secondChoiceBundle);
    return isMissingDefaultFilterDimensionValue
      ? renderLastOptionPlaceholder(
          config.body,
          chartContext,
          AnalyticsConfigChartPlaceholderState.NoData,
        )
      : resolvedSubcontext;
  }

  return resolvedSubcontext;
}

function ResolvedDimensionFilterAndBreakdownOverrideControlledSubcontext({
  config,
  chartContext: givenChartContext,
  onSelectChartRegion = null,
  chartLocation,
  chartUpdatePolicy,
  choiceBundles,
}: ResolvedDimensionFilterAndBreakdownOverrideControlledSubcontextProps) {
  const { body: bodyKey, controlConfigs, selectionStateKey } = config;
  const selectionStore = useRAQIV2ControlledSubcontextSelectionStore();

  const controlConfigWithContextOverride = useMemo(
    () =>
      controlConfigs.map((controlConfig) => {
        const contextFilter = givenChartContext.filter?.find(
          (f) => f.dimension === controlConfig.filterDimension,
        );
        if (
          contextFilter &&
          contextFilter.values.length > 0 &&
          controlConfig.defaultFilterDimensionValue
        ) {
          return { ...controlConfig, defaultFilterDimensionValue: contextFilter.values[0] };
        }
        return controlConfig;
      }),
    [controlConfigs, givenChartContext.filter],
  );

  const dimensionValueScopingFilters = useMemo<readonly RAQIV2APIQueryFilter[] | undefined>(() => {
    const contextFilters = givenChartContext.filter;
    if (!contextFilters || contextFilters.length === 0) {
      return undefined;
    }
    const filters = contextFilters.filter(
      (filter): filter is RAQIV2APIQueryFilter =>
        filter.dimension !== RAQIV2UIPseudoDimension.AggregationType &&
        filter.dimension !== RAQIV2UIPseudoDimension.PercentileType,
    );
    return filters.length > 0 ? filters : undefined;
  }, [givenChartContext.filter]);

  const selectionStateScopeKey = useMemo(
    () => JSON.stringify(dimensionValueScopingFilters),
    [dimensionValueScopingFilters],
  );

  const initialSelectedOptions = useMemo(() => {
    const defaultSelectedOptions = initializeSelectedOptions(
      controlConfigWithContextOverride,
      choiceBundles,
    );
    const persistedSelections =
      selectionStateKey && selectionStore
        ? selectionStore.get(selectionStateKey, selectionStateScopeKey)
        : undefined;
    return reconcilePersistedSelections(persistedSelections, defaultSelectedOptions, choiceBundles);
  }, [
    choiceBundles,
    controlConfigWithContextOverride,
    selectionStateKey,
    selectionStateScopeKey,
    selectionStore,
  ]);

  const selectedOptionsResetKey = useMemo(
    () =>
      JSON.stringify({
        controlConfigWithContextOverride,
        dimensionValueScopingFilters,
        defaultFilterDimensionValues: choiceBundles.map((choiceBundle) => choiceBundle.lastOption),
      }),
    [choiceBundles, controlConfigWithContextOverride, dimensionValueScopingFilters],
  );

  const [selectedOptionsState, setSelectedOptionsState] = useState(() => ({
    selectedOptionsResetKey,
    selectedOptions: initialSelectedOptions,
  }));

  if (selectedOptionsState.selectedOptionsResetKey !== selectedOptionsResetKey) {
    setSelectedOptionsState({
      selectedOptionsResetKey,
      selectedOptions: initialSelectedOptions,
    });
  }

  const selectedOptions =
    selectedOptionsState.selectedOptionsResetKey === selectedOptionsResetKey
      ? selectedOptionsState.selectedOptions
      : initialSelectedOptions;

  useEffect(() => {
    if (selectionStateKey && selectionStore) {
      selectionStore.set(selectionStateKey, selectionStateScopeKey, selectedOptions);
    }
  }, [selectedOptions, selectionStateKey, selectionStateScopeKey, selectionStore]);

  const setSelectedOptionsForControl = useCallback((controlIdx: number, newValue: string[]) => {
    setSelectedOptionsState((prevState) => {
      const newSelectedOptions = [...prevState.selectedOptions];
      newSelectedOptions[controlIdx] = newValue;
      return { ...prevState, selectedOptions: newSelectedOptions };
    });
  }, []);

  const isCurrentlyUnfiltered = !selectedOptions.some((options) => options.length > 0);

  const chartContext = useMemo(() => {
    const filterIntersectOverride: RAQIV2QueryFilter[] = selectedOptions
      .map((options, controlIdx) => {
        const dimension = controlConfigs[controlIdx].filterDimension;
        if (isFilterableDimension(dimension)) {
          if (dimension === RAQIV2UIPseudoDimension.AggregationType) {
            return {
              dimension: RAQIV2UIPseudoDimension.AggregationType,
              values: options.filter((option) => isValidEnumValue(RAQIV2AggregationType, option)),
            };
          }
          if (dimension === RAQIV2UIPseudoDimension.PercentileType) {
            return {
              dimension: RAQIV2UIPseudoDimension.PercentileType,
              values: options.filter((option) => isValidEnumValue(RAQIV2PercentileType, option)),
            };
          }
          return { dimension: dimension as RAQIV2Dimension, values: options };
        }
        // Unsupported dimension for filters
        return null;
      })
      .filter((filter): filter is RAQIV2QueryFilter => !!filter && filter.values.length > 0);
    const unfilteredBreakdownDimensions = controlConfigs
      .map((controlConfig) => controlConfig.unfilteredEntry?.breakdownDimensions)
      .filter((breakdown) => breakdown !== undefined)
      .flat();
    const breakdownDimensions = controlConfigs.flatMap(
      (controlConfig) => controlConfig.breakdownDimensions,
    );

    const overrides: SpecOverride = isCurrentlyUnfiltered
      ? {
          ...(unfilteredBreakdownDimensions.length > 0 && {
            breakdown: { override: unfilteredBreakdownDimensions },
          }),
        }
      : {
          ...(breakdownDimensions.length > 0 && {
            breakdown: { override: breakdownDimensions },
          }),
          filter: {
            intersect: filterIntersectOverride,
          },
        };
    return computeRAQIV2SpecOverride(givenChartContext, overrides);
  }, [controlConfigs, givenChartContext, isCurrentlyUnfiltered, selectedOptions]);

  const breakdownSummaryFilterOverride = useMemo<
    RAQIV2SummarySpec['breakdownSummaryFilter']
  >(() => {
    const breakdownSummaryFilter: NonNullable<RAQIV2SummarySpec['breakdownSummaryFilter']> = {};
    controlConfigs.forEach((controlConfig, controlIdx) => {
      const resolvedDefaultValue = choiceBundles[controlIdx]?.lastOption;
      if (
        controlConfig.filterSummaryToDefaultFilterDimensionValue &&
        resolvedDefaultValue !== undefined &&
        isValidEnumValue(RAQIV2Dimension, controlConfig.filterDimension)
      ) {
        breakdownSummaryFilter[controlConfig.filterDimension] = [resolvedDefaultValue];
      }
    });
    return Object.keys(breakdownSummaryFilter).length > 0 ? breakdownSummaryFilter : undefined;
  }, [choiceBundles, controlConfigs]);

  const controls = useMemo(() => {
    return controlConfigs.map((controlConfig, controlIdx) => {
      const selectedOptionsForControl = selectedOptions[controlIdx] ?? [];
      const choiceBundle = choiceBundles[controlIdx];
      if (!choiceBundle) {
        return null;
      }
      const controlConfigKey = JSON.stringify({
        controlConfig: controlConfigWithContextOverride[controlIdx] ?? controlConfig,
        dimensionValueScopingFilters,
      });
      return (
        <RAQIV2PredefinedSubcontextControl
          key={`${controlConfig.filterDimension}-${controlConfigKey}`}
          selectedOptions={selectedOptionsForControl}
          setSelectedOptions={(newValue: string[]) =>
            setSelectedOptionsForControl(controlIdx, newValue)
          }
          choiceBundle={choiceBundle}
          {...controlConfig}
          configKey={controlConfigKey}
        />
      );
    });
  }, [
    dimensionValueScopingFilters,
    choiceBundles,
    controlConfigWithContextOverride,
    controlConfigs,
    selectedOptions,
    setSelectedOptionsForControl,
  ]);

  return (
    <Grid item container direction='column'>
      <RecursiveAnalyticsComponent
        subcontextComponent={RAQIV2PredefinedControlledSubcontext}
        config={bodyKey}
        chartContext={chartContext}
        onSelectChartRegion={onSelectChartRegion}
        chartControl={<>{controls}</>}
        breakdownSummaryFilterOverride={breakdownSummaryFilterOverride}
        chartLocation={chartLocation}
        chartUpdatePolicy={chartUpdatePolicy}
      />
    </Grid>
  );
}

type TimeRangeDropdownSubcontextProps = {
  config: RAQIV2TimeRangeOverrideSubcontextConfig & {
    controlMode: RAQIV2TimeRangeControlMode.DateRangeDropdown;
  };
  chartContext: RAQIV2ChartContext;
  onSelectChartRegion?: null | SelectionCallback<number>;
  chartLocation?: ChartLocation;
  chartUpdatePolicy?: RAQIV2ChartUpdatePolicy;
};

function TimeRangeDropdownSubcontext({
  config,
  chartContext: givenChartContext,
  onSelectChartRegion: givenOnSelectChartRegion,
  chartLocation,
  chartUpdatePolicy,
}: TimeRangeDropdownSubcontextProps) {
  const { body: bodyKey, dateRangeOptions, defaultDateRangeType } = config;
  const {
    classes: { controlContainer },
  } = useStyles();

  const [localDateRange, setLocalDateRange] = useState<{
    type: RAQIV2DateRangeType;
    startDate: Date;
    endDate: Date;
  }>({
    type: defaultDateRangeType,
    startDate: givenChartContext.timeSpec.startTime,
    endDate: givenChartContext.timeSpec.endTime,
  });

  const chartContext: RAQIV2ChartContext = useMemo(() => {
    const granularity =
      config.granularityByDateRangeOverride[localDateRange.type] ?? givenChartContext.granularity;
    return {
      ...givenChartContext,
      timeSpec: {
        rangeType: RAQIV2DateRangeType.Custom,
        startTime: localDateRange.startDate,
        endTime: localDateRange.endDate,
      },
      granularity,
      timeAxisBounds: [localDateRange.startDate, localDateRange.endDate],
    };
  }, [
    config.granularityByDateRangeOverride,
    givenChartContext,
    localDateRange.endDate,
    localDateRange.startDate,
    localDateRange.type,
  ]);

  const onSelectChartRegion: SelectionCallback<number> = useCallback(
    ({ minX, maxX }) => {
      setLocalDateRange({
        type: RAQIV2DateRangeType.Custom,
        startDate: new Date(minX),
        endDate: new Date(maxX),
      });
      return givenOnSelectChartRegion?.({ minX, maxX });
    },
    [givenOnSelectChartRegion],
  );

  const onDateTypeChange = useCallback(
    (newDateRange: RAQIV2DateRangeType) => {
      if (newDateRange === defaultDateRangeType) {
        setLocalDateRange({
          type: newDateRange,
          startDate: givenChartContext.timeSpec.startTime,
          endDate: givenChartContext.timeSpec.endTime,
        });
      } else {
        switch (newDateRange) {
          case RAQIV2DateRangeType.Last1Hour:
            setLocalDateRange({
              type: newDateRange,
              startDate: new Date(Date.now() - 60 * 60 * 1000),
              endDate: new Date(),
            });
            break;
          case RAQIV2DateRangeType.Last1Day:
            setLocalDateRange({
              type: newDateRange,
              startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
              endDate: new Date(),
            });
            break;
          case RAQIV2DateRangeType.Last3Days:
          case RAQIV2DateRangeType.Last7Days:
          case RAQIV2DateRangeType.Last28Days:
          case RAQIV2DateRangeType.Last56Days:
          case RAQIV2DateRangeType.Last90Days:
          case RAQIV2DateRangeType.Last365Days: {
            // DateRangeTypes that don't get aligned to UTC-midnight have an offset of 0
            const endDate = new Date();
            const relativeDateOffset = dateRangeOffsetDays[newDateRange];
            const startDate = subDays(endDate, relativeDateOffset);
            setLocalDateRange({
              type: newDateRange,
              startDate,
              endDate,
            });
            break;
          }
          case RAQIV2DateRangeType.Custom:
            // Do nothing. Custom date range is handled by onCustomDateRangeChangeConfirmed
            // When user confirms the changes after select a custom date range
            break;
          default: {
            throw new Error(`Unknown date range type ${String(newDateRange)}`);
          }
        }
      }
    },
    [
      defaultDateRangeType,
      givenChartContext.timeSpec.endTime,
      givenChartContext.timeSpec.startTime,
    ],
  );

  const onCustomDateRangeChangeConfirmed = useCallback(
    (customStartDate: Date, customEndDate: Date) => {
      setLocalDateRange({
        type: RAQIV2DateRangeType.Custom,
        startDate: customStartDate,
        endDate: customEndDate,
      });
    },
    [],
  );

  const { minStartDate, maxEndDate } = useMemo(
    () => ({
      minStartDate: minimalDateForQuerying,
      maxEndDate: new Date(),
    }),
    [],
  );

  return (
    <Grid item container direction='column'>
      <RecursiveAnalyticsComponent
        subcontextComponent={RAQIV2PredefinedControlledSubcontext}
        config={bodyKey}
        chartContext={chartContext}
        onSelectChartRegion={onSelectChartRegion}
        chartLocation={chartLocation}
        chartUpdatePolicy={chartUpdatePolicy}
        chartControl={
          <div className={controlContainer}>
            <DateRangeControl
              dateRangeType={localDateRange.type}
              startDate={localDateRange.startDate}
              endDate={localDateRange.endDate}
              dateRangeOptions={dateRangeOptions}
              onChangeRangeType={onDateTypeChange}
              fullWidth
              minStartDate={minStartDate}
              maxEndDate={maxEndDate}
              onCustomDateRangeChangeConfirmed={onCustomDateRangeChangeConfirmed}
              size='small'
            />
          </div>
        }
      />
    </Grid>
  );
}

const ResetDateRangeTranslationKey = translationKey(
  'Action.ResetDateRange',
  TranslationNamespace.Analytics,
);

type ZoomResetOnlySubcontextProps = {
  config: RAQIV2TimeRangeOverrideSubcontextConfig & {
    controlMode: RAQIV2TimeRangeControlMode.ZoomResetOnly;
  };
  chartContext: RAQIV2ChartContext;
  chartLocation?: ChartLocation;
  chartUpdatePolicy?: RAQIV2ChartUpdatePolicy;
};

function ZoomResetOnlySubcontext({
  config,
  chartContext: givenChartContext,
  chartLocation,
  chartUpdatePolicy,
}: ZoomResetOnlySubcontextProps) {
  const { body: bodyKey } = config;
  const { translate } = useRAQIV2TranslationDependencies();

  const [zoomedRange, setZoomedRange] = useState<{
    startDate: Date;
    endDate: Date;
  } | null>(null);

  const chartContext: RAQIV2ChartContext = useMemo(() => {
    const { startTime, endTime } = zoomedRange
      ? { startTime: zoomedRange.startDate, endTime: zoomedRange.endDate }
      : givenChartContext.timeSpec;
    return {
      ...givenChartContext,
      timeSpec: { rangeType: RAQIV2DateRangeType.Custom, startTime, endTime },
      timeAxisBounds: [startTime, endTime],
    };
  }, [givenChartContext, zoomedRange]);

  const onSelectChartRegion: SelectionCallback<number> = useCallback(({ minX, maxX }) => {
    setZoomedRange({ startDate: new Date(minX), endDate: new Date(maxX) });
  }, []);

  const resetButton = zoomedRange ? (
    <Button
      onClick={() => setZoomedRange(null)}
      variant='contained'
      color='secondary'
      size='small'
      disableRipple>
      {translate(ResetDateRangeTranslationKey)}
    </Button>
  ) : null;

  return (
    <RecursiveAnalyticsComponent
      subcontextComponent={RAQIV2PredefinedControlledSubcontext}
      config={bodyKey}
      chartContext={chartContext}
      onSelectChartRegion={onSelectChartRegion}
      chartControl={resetButton}
      chartLocation={chartLocation}
      chartUpdatePolicy={chartUpdatePolicy}
    />
  );
}

type TimeRangeControlledSubcontextProps = {
  config: RAQIV2TimeRangeOverrideSubcontextConfig;
  chartContext: RAQIV2ChartContext;
  onSelectChartRegion?: null | SelectionCallback<number>;
  chartLocation?: ChartLocation;
  chartUpdatePolicy?: RAQIV2ChartUpdatePolicy;
};

function TimeRangeControlledSubcontext({ config, ...props }: TimeRangeControlledSubcontextProps) {
  const { controlMode } = config;
  switch (controlMode) {
    case RAQIV2TimeRangeControlMode.DateRangeDropdown:
      return <TimeRangeDropdownSubcontext config={config} {...props} />;
    case RAQIV2TimeRangeControlMode.ZoomResetOnly:
      return <ZoomResetOnlySubcontext config={config} {...props} />;
    default: {
      const exhaustiveCheck: never = controlMode;
      throw new Error(`Unknown TimeRange control mode ${String(exhaustiveCheck)}`);
    }
  }
}

function RAQIV2PredefinedControlledSubcontext({
  config,
  ...props
}: RAQIV2PredefinedControlledSubcontextProps) {
  const { subcontextType: type } = config;
  switch (type) {
    case RAQIV2ControlledSubcontextType.DimensionFilterAndBreakdownOverride:
      return <DimensionFilterAndBreakdownOverrideControlledSubcontext {...props} config={config} />;
    case RAQIV2ControlledSubcontextType.TimeRangeOverride:
      return <TimeRangeControlledSubcontext {...props} config={config} />;
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unknown predefined controlled subcontext type ${String(exhaustiveCheck)}`);
    }
  }
}
export default RAQIV2PredefinedControlledSubcontext;
