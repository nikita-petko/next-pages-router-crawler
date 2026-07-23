import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { RAQIV2DimensionDisplayConfig } from '@rbx/creator-hub-analytics-config';
import { makeStyles } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import FilterStringChoice, {
  BlankHandlingType,
} from '@modules/charts-generic/components/FilterStringChoice';
import type { RAQIV2APIQueryFilter } from '@modules/clients/analytics';
import type { ChartConfigOrPredefinedKey } from '../../../constants/RAQIV2PredefinedChartConfig';
import type { TabbedChartConfigOrPredefinedKey } from '../../../constants/RAQIV2PredefinedTabbedChartConfig';
import type { AnalyticsTabbedTableConfig } from '../../../constants/RAQIV2PredefinedTabbedTableConfigs';
import type { AnalyticsTableConfig } from '../../../constants/RAQIV2PredefinedTableConfig';
import useRAQIV2DimensionChoiceRenderBundle from '../../../hooks/useRAQIV2DimensionChoiceRenderBundle';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import type { ChartResource } from '../../../types/ChartResourceContextType';
import getPredefinedComponentMetrics from '../../../utils/getPredefinedComponentMetrics';
import type { RAQIV2DimensionFilterAndBreakdownOverrideConfig } from './RAQIV2ControlledSubcontextConfig';
import { RAQIV2DefaultFilterDimensionValueMode } from './RAQIV2ControlledSubcontextConfig';

// Keep the control width stable so long dynamic labels truncate instead of resizing the layout.
const subcontextControlWidth = '220px';

export const useStyles = makeStyles()(() => ({
  controlContainer: {
    width: subcontextControlWidth,
    paddingTop: '8px',
  },
}));

type RAQIV2PredefinedSubcontextControlChoiceBundleProps = {
  body:
    | ChartConfigOrPredefinedKey
    | TabbedChartConfigOrPredefinedKey
    | AnalyticsTableConfig
    | AnalyticsTabbedTableConfig;
  resource: ChartResource;
  filterDimension: RAQIV2DimensionFilterAndBreakdownOverrideConfig['filterDimension'];
  defaultFilterDimensionValueMode?: RAQIV2DimensionFilterAndBreakdownOverrideConfig['defaultFilterDimensionValueMode'];
  pinDefaultFilterDimensionValue?: RAQIV2DimensionFilterAndBreakdownOverrideConfig['pinDefaultFilterDimensionValue'];
  dimensionValueScopingFilters?: readonly RAQIV2APIQueryFilter[];
};

export type RAQIV2PredefinedSubcontextControlChoiceBundle = {
  enumOptions: string[];
  isDataLoading: boolean;
  formatOption: (option: string) => FormattedText;
  lastOption: string | undefined;
  pinnedOptions: string[];
};

export const useRAQIV2PredefinedSubcontextControlChoiceBundle = ({
  body: bodyKey,
  resource,
  filterDimension,
  defaultFilterDimensionValueMode,
  pinDefaultFilterDimensionValue = false,
  dimensionValueScopingFilters,
}: RAQIV2PredefinedSubcontextControlChoiceBundleProps): RAQIV2PredefinedSubcontextControlChoiceBundle => {
  const contextMetrics = useMemo(() => getPredefinedComponentMetrics(bodyKey), [bodyKey]);
  const { enumOptions, isDataLoading, formatOption } = useRAQIV2DimensionChoiceRenderBundle(
    resource,
    filterDimension,
    contextMetrics,
    undefined,
    { onlyFilterSupportedValues: true, filter: dimensionValueScopingFilters },
  );
  const lastOption = enumOptions.at(-1);
  const pinnedOptions = useMemo(
    () =>
      pinDefaultFilterDimensionValue &&
      defaultFilterDimensionValueMode === RAQIV2DefaultFilterDimensionValueMode.LastOption &&
      lastOption !== undefined
        ? [lastOption]
        : [],
    [defaultFilterDimensionValueMode, lastOption, pinDefaultFilterDimensionValue],
  );

  return useMemo(
    () => ({
      enumOptions,
      isDataLoading,
      formatOption,
      lastOption,
      pinnedOptions,
    }),
    [enumOptions, formatOption, isDataLoading, lastOption, pinnedOptions],
  );
};

type RAQIV2PredefinedSubcontextControlProps = RAQIV2DimensionFilterAndBreakdownOverrideConfig & {
  selectedOptions: string[];
  setSelectedOptions: (newValue: string[]) => void;
  choiceBundle: RAQIV2PredefinedSubcontextControlChoiceBundle;
  configKey: string;
};

const RAQIV2PredefinedSubcontextControl: FC<RAQIV2PredefinedSubcontextControlProps> = ({
  filterDimension,
  unfilteredEntry,
  multiple = false,
  maxSelectedOptions,
  defaultFilterDimensionValueMode,
  pinDefaultFilterDimensionValue = false,
  truncateValue,
  selectedOptions,
  setSelectedOptions,
  choiceBundle,
  configKey,
}) => {
  const hasUserSelectedOptionsRef = useRef(false);
  const {
    classes: { controlContainer },
  } = useStyles();
  const { translate } = useRAQIV2TranslationDependencies();
  const { enumOptions, isDataLoading, formatOption, lastOption, pinnedOptions } = choiceBundle;

  const label = useMemo(() => {
    const dimensionName = RAQIV2DimensionDisplayConfig[filterDimension].name;
    return dimensionName ? translate(dimensionName) : undefined;
  }, [filterDimension, translate]);

  const blankHandling = useMemo(() => {
    const unfilteredEntryText = unfilteredEntry?.text;
    if (!unfilteredEntryText) {
      return undefined;
    }
    const blankValue = translate(unfilteredEntryText);
    return {
      type: BlankHandlingType.Value as const,
      value: blankValue,
    };
  }, [translate, unfilteredEntry]);

  useEffect(() => {
    hasUserSelectedOptionsRef.current = false;
  }, [configKey]);

  useEffect(() => {
    if (
      defaultFilterDimensionValueMode !== RAQIV2DefaultFilterDimensionValueMode.LastOption ||
      isDataLoading ||
      lastOption === undefined
    ) {
      return;
    }

    if (pinDefaultFilterDimensionValue && !selectedOptions.includes(lastOption)) {
      setSelectedOptions([...selectedOptions, lastOption]);
      return;
    }

    if (!hasUserSelectedOptionsRef.current && selectedOptions.length === 0) {
      setSelectedOptions([lastOption]);
    }
  }, [
    defaultFilterDimensionValueMode,
    configKey,
    isDataLoading,
    lastOption,
    pinDefaultFilterDimensionValue,
    selectedOptions,
    setSelectedOptions,
  ]);

  const handleSelectedOptionsChange = useCallback(
    (newValue: string[]) => {
      hasUserSelectedOptionsRef.current = true;
      setSelectedOptions(newValue);
    },
    [setSelectedOptions],
  );

  return (
    <div className={controlContainer}>
      <FilterStringChoice
        multiple={multiple}
        selectedOptions={selectedOptions}
        onChange={handleSelectedOptionsChange}
        options={enumOptions}
        formatOption={formatOption}
        blankHandling={blankHandling}
        maxSelectedOptions={maxSelectedOptions}
        pinnedOptions={pinnedOptions}
        truncateValue={truncateValue}
        isLoading={isDataLoading}
        label={label}
        size='small'
      />
    </div>
  );
};

export default RAQIV2PredefinedSubcontextControl;
