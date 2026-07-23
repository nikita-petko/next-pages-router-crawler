import React, { FC, useMemo } from 'react';
import { makeStyles } from '@rbx/ui';
import { RAQIV2DimensionDisplayConfig } from '@rbx/creator-hub-analytics-config';
import { BlankHandlingType, FilterStringChoice } from '@modules/charts-generic';
import { AnalyticsTabbedTableConfig } from '../../../constants/RAQIV2PredefinedTabbedTableConfigs';
import { AnalyticsTableConfig } from '../../../constants/RAQIV2PredefinedTableConfig';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import useRAQIV2DimensionChoiceRenderBundle from '../../../hooks/useRAQIV2DimensionChoiceRenderBundle';
import getPredefinedComponentMetrics from '../../../utils/getPredefinedComponentMetrics';
import { RAQIV2DimensionFilterAndBreakdownOverrideConfig } from './RAQIV2ControlledSubcontextConfig';
import { ChartConfigOrPredefinedKey } from '../../../constants/RAQIV2PredefinedChartConfig';
import { TabbedChartConfigOrPredefinedKey } from '../../../constants/RAQIV2PredefinedTabbedChartConfig';
import { ChartResource } from '../../../types/ChartResourceContextType';

export const useStyles = makeStyles()(() => ({
  controlContainer: {
    minWidth: '180px',
    paddingTop: '8px',
  },
}));

type RAQIV2PredefinedSubcontextControlProps = RAQIV2DimensionFilterAndBreakdownOverrideConfig & {
  body:
    | ChartConfigOrPredefinedKey
    | TabbedChartConfigOrPredefinedKey
    | AnalyticsTableConfig
    | AnalyticsTabbedTableConfig;
  resource: ChartResource;
  selectedOptions: string[];
  setSelectedOptions: (newValue: string[]) => void;
};

const RAQIV2PredefinedSubcontextControl: FC<RAQIV2PredefinedSubcontextControlProps> = ({
  body: bodyKey,
  resource,
  filterDimension,
  unfilteredEntry,
  selectedOptions,
  setSelectedOptions,
}) => {
  const {
    classes: { controlContainer },
  } = useStyles();
  const { translate } = useRAQIV2TranslationDependencies();
  const contextMetrics = useMemo(() => getPredefinedComponentMetrics(bodyKey), [bodyKey]);
  const { enumOptions, isDataLoading, formatOption } = useRAQIV2DimensionChoiceRenderBundle(
    resource,
    filterDimension,
    contextMetrics,
  );

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

  return (
    <div className={controlContainer}>
      <FilterStringChoice
        multiple={false}
        selectedOptions={selectedOptions}
        onChange={setSelectedOptions}
        options={enumOptions}
        formatOption={formatOption}
        blankHandling={blankHandling}
        isLoading={isDataLoading}
        label={label}
        size='small'
      />
    </div>
  );
};

export default RAQIV2PredefinedSubcontextControl;
