import type { FunctionComponent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import type { SelectionCallback } from '@rbx/analytics-ui';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import FilterStringChoice from '@modules/charts-generic/components/FilterStringChoice';
import type { RAQIV2QueryFilter } from '@modules/clients/analytics';
import AnalyticsConfigChart from '@modules/experience-analytics-shared/components/RAQIV2/AnalyticsConfigChart';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import computeRAQIV2SpecOverride from '@modules/experience-analytics-shared/utils/computeRAQIV2SpecOverride';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { chartConfigDataStoreRequestsByEndpoint } from './dataStoreChartConfigs';

const DataStoreRequestOperationGroup = {
  Read: 'Read',
  Write: 'Write',
  List: 'List',
  Remove: 'Remove',
} as const;

type DataStoreRequestOperationGroup =
  (typeof DataStoreRequestOperationGroup)[keyof typeof DataStoreRequestOperationGroup];

const DataStoreRequestOperationGroupOptions = [
  DataStoreRequestOperationGroup.Read,
  DataStoreRequestOperationGroup.Write,
  DataStoreRequestOperationGroup.List,
  DataStoreRequestOperationGroup.Remove,
] as const satisfies readonly DataStoreRequestOperationGroup[];

const DataStoreRequestOperationGroupFilters = {
  [DataStoreRequestOperationGroup.Read]: [
    'GetAsync',
    'GetSortedAsync',
    'GetVersionAsync',
    'GetVersionAtTimeAsync',
  ],
  [DataStoreRequestOperationGroup.Write]: ['SetAsync', 'UpdateAsync', 'IncrementAsync'],
  [DataStoreRequestOperationGroup.List]: [
    'ListKeysAsync',
    'ListVersionsAsync',
    'ListDataStoresAsync',
    'DataStorePagesAdvanceToNextPageAsync',
    'DataStoreKeyPagesAdvanceToNextPageAsync',
    'DataStoreVersionPagesAdvanceToNextPageAsync',
    'DataStoreListingPagesAdvanceToNextPageAsync',
  ],
  [DataStoreRequestOperationGroup.Remove]: ['RemoveAsync'],
} as const satisfies Record<DataStoreRequestOperationGroup, readonly string[]>;

const ChartControlClassName = '[min-width:180px] padding-top-small';
const HiddenChartControlClassName = `${ChartControlClassName} pointer-events-none invisible`;

const getOperationGroupTranslationKey = (operationGroup: DataStoreRequestOperationGroup) => {
  switch (operationGroup) {
    case DataStoreRequestOperationGroup.Read:
      return translationKey(
        'Label.DataStoreRequestsBreakdownRead',
        TranslationNamespace.CloudServices,
      );
    case DataStoreRequestOperationGroup.Write:
      return translationKey(
        'Label.DataStoreRequestsBreakdownWrite',
        TranslationNamespace.CloudServices,
      );
    case DataStoreRequestOperationGroup.List:
      return translationKey(
        'Label.DataStoreRequestsBreakdownList',
        TranslationNamespace.CloudServices,
      );
    case DataStoreRequestOperationGroup.Remove:
      return translationKey(
        'Label.DataStoreRequestsBreakdownRemove',
        TranslationNamespace.CloudServices,
      );
    default: {
      const exhaustiveCheck: never = operationGroup;
      throw new Error(`Unknown Data Store request operation group ${String(exhaustiveCheck)}`);
    }
  }
};

type DataStoreRequestsByApiChartControlProps = {
  readonly selectedOperationGroup: DataStoreRequestOperationGroup;
  readonly onChangeOperationGroup: (newValue: DataStoreRequestOperationGroup[]) => void;
  readonly hidden?: boolean;
};

const DataStoreRequestsByApiChartControl: FunctionComponent<
  DataStoreRequestsByApiChartControlProps
> = ({ selectedOperationGroup, onChangeOperationGroup, hidden = false }) => {
  const { translate } = useRAQIV2TranslationDependencies();

  const breakdownLabel = useMemo(
    () => translate(translationKey('Title.Breakdown', TranslationNamespace.CloudServices)),
    [translate],
  );

  const formatOperationGroup = useCallback(
    (operationGroup: DataStoreRequestOperationGroup) =>
      translate(getOperationGroupTranslationKey(operationGroup)),
    [translate],
  );

  return (
    <div
      aria-hidden={hidden || undefined}
      className={hidden ? HiddenChartControlClassName : ChartControlClassName}>
      <FilterStringChoice<DataStoreRequestOperationGroup>
        multiple={false}
        selectedOptions={[selectedOperationGroup]}
        onChange={onChangeOperationGroup}
        options={[...DataStoreRequestOperationGroupOptions]}
        formatOption={formatOperationGroup}
        label={breakdownLabel}
        size='small'
      />
    </div>
  );
};

export const DataStoreRequestsByApiChartControlSpacer: FunctionComponent = () => {
  const onChangeOperationGroup = useCallback(() => {}, []);

  return (
    <DataStoreRequestsByApiChartControl
      selectedOperationGroup={DataStoreRequestOperationGroup.Read}
      onChangeOperationGroup={onChangeOperationGroup}
      hidden
    />
  );
};

type DataStoreRequestsByApiChartProps = {
  chartContext: RAQIV2ChartContext;
  onSelectChartRegion: null | SelectionCallback<number>;
};

const DataStoreRequestsByApiChart: FunctionComponent<DataStoreRequestsByApiChartProps> = ({
  chartContext,
  onSelectChartRegion,
}) => {
  const [selectedOperationGroup, setSelectedOperationGroup] =
    useState<DataStoreRequestOperationGroup>(DataStoreRequestOperationGroup.Read);

  const chartContextWithOperationFilter = useMemo(() => {
    const operationFilter: RAQIV2QueryFilter = {
      dimension: RAQIV2Dimension.DataStoreOperation,
      values: [...DataStoreRequestOperationGroupFilters[selectedOperationGroup]],
    };
    return computeRAQIV2SpecOverride(chartContext, {
      filter: {
        intersect: [operationFilter],
      },
    });
  }, [chartContext, selectedOperationGroup]);

  const onChangeOperationGroup = useCallback((newValue: DataStoreRequestOperationGroup[]) => {
    const [nextOperationGroup] = newValue;
    if (nextOperationGroup) {
      setSelectedOperationGroup(nextOperationGroup);
    }
  }, []);

  const chartControl = useMemo(
    () => (
      <DataStoreRequestsByApiChartControl
        selectedOperationGroup={selectedOperationGroup}
        onChangeOperationGroup={onChangeOperationGroup}
      />
    ),
    [onChangeOperationGroup, selectedOperationGroup],
  );

  return (
    <AnalyticsConfigChart
      chartKeyOrConfig={chartConfigDataStoreRequestsByEndpoint}
      chartContext={chartContextWithOperationFilter}
      onSelectChartRegion={onSelectChartRegion}
      chartControl={chartControl}
    />
  );
};

export default DataStoreRequestsByApiChart;
