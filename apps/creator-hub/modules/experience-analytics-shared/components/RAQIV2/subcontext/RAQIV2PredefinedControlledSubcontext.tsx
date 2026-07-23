import { dateRangeOffsetDays, DateRangeType } from '@modules/charts-generic';
import React, { FC, useCallback, useMemo, useState, Fragment, useEffect } from 'react';
import { Button, Grid } from '@rbx/ui';
import { RAQIV2QueryFilter } from '@modules/clients/analytics';
import { subDays } from '@rbx/core';
import { SelectionCallback } from '@rbx/analytics-ui';
import {
  RAQIV2AggregationType,
  RAQIV2Dimension,
  RAQIV2PercentileType,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { minimalDateForQuerying } from '../../../constants/analyticsMetadata';
import computeRAQIV2SpecOverride, { SpecOverride } from '../../../utils/computeRAQIV2SpecOverride';
import RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import {
  AnalyticsControlledSubcontextConfig,
  RAQIV2ControlledSubcontextType,
  RAQIV2TimeRangeControlMode,
  RAQIV2TimeRangeOverrideSubcontextConfig,
  RAQIV2DimensionFilterAndBreakdownOverrideSubcontextConfig,
  RAQIV2DimensionFilterAndBreakdownOverrideConfig,
} from './RAQIV2ControlledSubcontextConfig';
import AnalyticsComponent from '../layout/AnalyticsComponent';
import DateRangeControl from '../../DateRangeControl';
import RAQIV2PredefinedSubcontextControl, { useStyles } from './RAQIV2PredefinedSubcontextControl';
import { isFilterableDimension } from '../../../constants/FilterDimensionConfig';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';

type RAQIV2PredefinedControlledSubcontextProps = {
  config: AnalyticsControlledSubcontextConfig;
} & SharedProps;

type SharedProps = {
  chartContext: RAQIV2ChartContext;
  onSelectChartRegion?: null | SelectionCallback<number>;
};

type DimensionFilterAndBreakdownOverrideControlledSubcontextProps = {
  config: RAQIV2DimensionFilterAndBreakdownOverrideSubcontextConfig;
} & SharedProps;

const initializeSelectedOptions = (
  controlConfigs: RAQIV2DimensionFilterAndBreakdownOverrideConfig[],
) => {
  return controlConfigs.map((config) => {
    return config.defaultFilterDimensionValue ? [config.defaultFilterDimensionValue] : [];
  });
};

const DimensionFilterAndBreakdownOverrideControlledSubcontext: FC<
  DimensionFilterAndBreakdownOverrideControlledSubcontextProps
> = ({ config, chartContext: givenChartContext, onSelectChartRegion = null }) => {
  const { body: bodyKey, controlConfigs } = config;

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

  const [selectedOptions, setSelectedOptions] = useState<string[][]>(
    initializeSelectedOptions(controlConfigWithContextOverride),
  );

  useEffect(() => {
    setSelectedOptions(initializeSelectedOptions(controlConfigWithContextOverride));
  }, [controlConfigWithContextOverride]);

  const setSelectedOptionsForControl = useCallback((controlIdx: number, newValue: string[]) => {
    setSelectedOptions((prevSelectedOptions) => {
      const newSelectedOptions = [...prevSelectedOptions];
      newSelectedOptions[controlIdx] = newValue;
      return newSelectedOptions;
    });
  }, []);

  const chartContext = useMemo(() => {
    const isCurrentlyUnfiltered = !selectedOptions.some((options) => options.length > 0);
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
    const breakdownDimensions = controlConfigs
      .map((controlConfig) => controlConfig.breakdownDimensions)
      .flat();

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
  }, [controlConfigs, givenChartContext, selectedOptions]);

  const controls = useMemo(() => {
    return controlConfigs.map((controlConfig, controlIdx) => {
      const selectedOptionsForControl = selectedOptions[controlIdx];
      return (
        <RAQIV2PredefinedSubcontextControl
          key={controlConfig.filterDimension}
          selectedOptions={selectedOptionsForControl}
          setSelectedOptions={(newValue) => setSelectedOptionsForControl(controlIdx, newValue)}
          {...controlConfig}
          body={bodyKey}
          resource={givenChartContext.resource}
        />
      );
    });
  }, [
    bodyKey,
    controlConfigs,
    givenChartContext.resource,
    selectedOptions,
    setSelectedOptionsForControl,
  ]);

  return (
    <Grid item container direction='column'>
      <AnalyticsComponent
        config={bodyKey}
        chartContext={chartContext}
        onSelectChartRegion={onSelectChartRegion}
        chartControl={<Fragment>{controls}</Fragment>}
      />
    </Grid>
  );
};

type TimeRangeDropdownSubcontextProps = {
  config: RAQIV2TimeRangeOverrideSubcontextConfig & {
    controlMode: RAQIV2TimeRangeControlMode.DateRangeDropdown;
  };
  chartContext: RAQIV2ChartContext;
  onSelectChartRegion?: null | SelectionCallback<number>;
};

const TimeRangeDropdownSubcontext: FC<TimeRangeDropdownSubcontextProps> = ({
  config,
  chartContext: givenChartContext,
  onSelectChartRegion: givenOnSelectChartRegion,
}) => {
  const { body: bodyKey, dateRangeOptions, defaultDateRangeType } = config;
  const {
    classes: { controlContainer },
  } = useStyles();

  const [localDateRange, setLocalDateRange] = useState<{
    type: DateRangeType;
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
        type: DateRangeType.Custom,
        startDate: new Date(minX),
        endDate: new Date(maxX),
      });
      return givenOnSelectChartRegion?.call(this, { minX, maxX });
    },
    [givenOnSelectChartRegion],
  );

  const onDateTypeChange = useCallback(
    (newDateRange: DateRangeType) => {
      if (newDateRange === defaultDateRangeType) {
        setLocalDateRange({
          type: newDateRange,
          startDate: givenChartContext.timeSpec.startTime,
          endDate: givenChartContext.timeSpec.endTime,
        });
      } else {
        switch (newDateRange) {
          case DateRangeType.Last1Hour:
            setLocalDateRange({
              type: newDateRange,
              startDate: new Date(Date.now() - 60 * 60 * 1000),
              endDate: new Date(),
            });
            break;
          case DateRangeType.Last1Day:
            setLocalDateRange({
              type: newDateRange,
              startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
              endDate: new Date(),
            });
            break;
          case DateRangeType.Last3Days:
          case DateRangeType.Last7Days:
          case DateRangeType.Last28Days:
          case DateRangeType.Last56Days:
          case DateRangeType.Last90Days:
          case DateRangeType.Last365Days: {
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
          case DateRangeType.Custom:
            // Do nothing. Custom date range is handled by onCustomDateRangeChangeConfirmed
            // When user confirms the changes after select a custom date range
            break;
          default: {
            const exhaustiveCheck: never = newDateRange;
            throw new Error(`Unknown date range type ${exhaustiveCheck}`);
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
        type: DateRangeType.Custom,
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
      <AnalyticsComponent
        config={bodyKey}
        chartContext={chartContext}
        onSelectChartRegion={onSelectChartRegion}
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
};

const ResetDateRangeTranslationKey = translationKey(
  'Action.ResetDateRange',
  TranslationNamespace.Analytics,
);

type ZoomResetOnlySubcontextProps = {
  config: RAQIV2TimeRangeOverrideSubcontextConfig & {
    controlMode: RAQIV2TimeRangeControlMode.ZoomResetOnly;
  };
  chartContext: RAQIV2ChartContext;
};

const ZoomResetOnlySubcontext: FC<ZoomResetOnlySubcontextProps> = ({
  config,
  chartContext: givenChartContext,
}) => {
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
      timeSpec: { startTime, endTime },
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
    <AnalyticsComponent
      config={bodyKey}
      chartContext={chartContext}
      onSelectChartRegion={onSelectChartRegion}
      chartControl={resetButton}
    />
  );
};

type TimeRangeControlledSubcontextProps = {
  config: RAQIV2TimeRangeOverrideSubcontextConfig;
  chartContext: RAQIV2ChartContext;
  onSelectChartRegion?: null | SelectionCallback<number>;
};

const TimeRangeControlledSubcontext: FC<TimeRangeControlledSubcontextProps> = ({
  config,
  ...props
}) => {
  const { controlMode } = config;
  switch (controlMode) {
    case RAQIV2TimeRangeControlMode.DateRangeDropdown:
      return <TimeRangeDropdownSubcontext config={config} {...props} />;
    case RAQIV2TimeRangeControlMode.ZoomResetOnly:
      return <ZoomResetOnlySubcontext config={config} {...props} />;
    default: {
      const exhaustiveCheck: never = controlMode;
      throw new Error(`Unknown TimeRange control mode ${exhaustiveCheck}`);
    }
  }
};

const RAQIV2PredefinedControlledSubcontext: FC<RAQIV2PredefinedControlledSubcontextProps> = ({
  config,
  ...props
}) => {
  const { subcontextType: type } = config;
  switch (type) {
    case RAQIV2ControlledSubcontextType.DimensionFilterAndBreakdownOverride:
      return <DimensionFilterAndBreakdownOverrideControlledSubcontext {...props} config={config} />;
    case RAQIV2ControlledSubcontextType.TimeRangeOverride:
      return <TimeRangeControlledSubcontext {...props} config={config} />;
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unknown predefined controlled subcontext type ${exhaustiveCheck}`);
    }
  }
};
export default RAQIV2PredefinedControlledSubcontext;
