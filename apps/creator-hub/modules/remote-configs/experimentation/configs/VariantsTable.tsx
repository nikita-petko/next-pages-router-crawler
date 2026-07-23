import { useCallback, useMemo } from 'react';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { makeStyles } from '@rbx/ui';
import { isTargetingConfigsEnabled as isTargetingConfigsEnabledFlag } from '@generated/flags/creatorAnalytics';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import {
  ColumnType,
  type TableColumnConfig,
} from '@modules/charts-generic/tables/types/GenericColumnType';
import type {
  CellDataType,
  GenericTableV2ExpandedRowColumnsByColumn,
} from '@modules/charts-generic/tables/types/GenericTableType';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ValidConfigExperimentVariant } from '../../api/validExperimentationTypes';
import type { ValidConfigEntry, ValidConfigEntryValue } from '../../api/validTypes';
import { asConditionNameChipCellData } from '../../components/ConditionNameChip';
import {
  configEntryHasConditionValues,
  configEntryToExpandedConditionValues,
  type ExpandedConditionValue,
} from '../../utils/configConditionValueExpansion';
import { configEntryToStringValueForTable } from '../../utils/configEntryToStringValue';

const tableConfig = {
  tableBorder: false,
};

enum ColumnKey {
  VariantName = 'variantName',
  VariantWeight = 'variantWeight',
  VariantValue = 'variantValue',
}

const columnConfigs: TableColumnConfig<ColumnKey>[] = [
  {
    columnKey: ColumnKey.VariantName,
    titleKey: translationKey(
      'Label.Table.VariantName',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    columnType: ColumnType.Text,
  },
  {
    columnKey: ColumnKey.VariantWeight,
    titleKey: translationKey(
      'Label.Table.VariantWeight',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    columnType: ColumnType.Text,
  },
  {
    columnKey: ColumnKey.VariantValue,
    titleKey: translationKey(
      'Label.Table.VariantValue',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    columnType: ColumnType.Code,
  },
];

const useStyles = makeStyles()(() => ({
  tableContainer: {
    maxWidth: '1000px',
  },
}));

type VariantsTableProps = {
  variants: ValidConfigExperimentVariant[];
  baselinePublishedEntry?: ValidConfigEntry;
  conditionOrder?: string[];
  isDataLoading?: boolean;
};

const configEntryValueToCellData = (
  value: ValidConfigEntryValue | undefined,
): CellDataType<string, ValidConfigExperimentVariant> => {
  const stringValue = configEntryToStringValueForTable(value);
  return {
    type: ColumnType.Code,
    value: stringValue.value,
    language: stringValue.language,
    useMonoFont: stringValue.useMonoFont,
  };
};

const VariantsTable = ({
  variants,
  baselinePublishedEntry,
  conditionOrder,
  isDataLoading = false,
}: VariantsTableProps) => {
  const {
    classes: { tableContainer },
  } = useStyles();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { id: universeId } = useUniverseResource();
  const { ready: isTargetingConfigsReady, value: isTargetingConfigsEnabledValue } = useFlag(
    isTargetingConfigsEnabledFlag,
    {
      universeId,
    },
  );
  const isTargetingConfigsEnabled = isTargetingConfigsReady && isTargetingConfigsEnabledValue;

  const multipleValueLabel = tPendingTranslation(
    'Multiple',
    'Label for a multiple value in the table.',
    translationKey(
      'Table.Column.Value.Multiple',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const defaultValueLabel = tPendingTranslation(
    'Default',
    'Label for a default value in the table.',
    translationKey(
      'Table.Column.Value.Default',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  const tableRows = useMemo(() => {
    return variants.map((variant) => {
      const baselineEntryValue =
        variant.isBaseline &&
        isTargetingConfigsEnabled &&
        variant.configEntry.entryValue == null &&
        baselinePublishedEntry
          ? baselinePublishedEntry.entryValue
          : (variant.configEntry.entryValue ?? undefined);

      const hasBaselineConditionValues =
        variant.isBaseline &&
        isTargetingConfigsEnabled &&
        configEntryHasConditionValues(baselinePublishedEntry);

      const valueCellData: CellDataType<string, ValidConfigExperimentVariant> =
        hasBaselineConditionValues
          ? {
              type: ColumnType.Code,
              value: multipleValueLabel,
            }
          : {
              type: ColumnType.Code,
              ...configEntryToStringValueForTable(baselineEntryValue),
            };

      return {
        rowKey: variant.variantId,
        variant,
        hasBaselineConditionValues,
        rowData: new Map<ColumnKey, CellDataType<string, ValidConfigExperimentVariant>>([
          [ColumnKey.VariantName, { type: ColumnType.Text, value: variant.label }],
          [ColumnKey.VariantWeight, { type: ColumnType.Text, value: `${variant.weight}%` }],
          [ColumnKey.VariantValue, valueCellData],
        ]),
      };
    });
  }, [baselinePublishedEntry, isTargetingConfigsEnabled, multipleValueLabel, variants]);

  const rowData = useMemo(() => {
    return tableRows.map(({ rowData: tableRowData }) => tableRowData);
  }, [tableRows]);

  const getExpandedConditionValuesByRowIndex = useCallback(
    (rowIndex: number): ExpandedConditionValue[] => {
      const tableRow = tableRows[rowIndex];
      if (!tableRow?.hasBaselineConditionValues || !baselinePublishedEntry) {
        return [];
      }

      return configEntryToExpandedConditionValues(
        baselinePublishedEntry,
        defaultValueLabel,
        undefined,
        conditionOrder,
      );
    },
    [baselinePublishedEntry, conditionOrder, defaultValueLabel, tableRows],
  );

  const getRowKey = useCallback(
    (
      _rowInfo: Map<ColumnKey, CellDataType<string, ValidConfigExperimentVariant>>,
      rowIndex: number,
    ) => {
      return tableRows[rowIndex]?.rowKey ?? `${rowIndex}`;
    },
    [tableRows],
  );

  const isRowExpandable = useCallback(
    (
      _rowInfo: Map<ColumnKey, CellDataType<string, ValidConfigExperimentVariant>>,
      rowIndex: number,
    ) => {
      return tableRows[rowIndex]?.hasBaselineConditionValues ?? false;
    },
    [tableRows],
  );

  const defaultExpandedRowKeys = useMemo(() => {
    return tableRows
      .filter(({ hasBaselineConditionValues }) => hasBaselineConditionValues)
      .map(({ rowKey }) => rowKey);
  }, [tableRows]);

  const expandedRowColumnsByColumn = useMemo<
    GenericTableV2ExpandedRowColumnsByColumn<ColumnKey, string, ValidConfigExperimentVariant>
  >(
    () => ({
      [ColumnKey.VariantName]: {
        columnConfig: {
          columnType: ColumnType.Other,
          columnAlignment: 'right',
        },
        getCellData: ({ rowIndex }) => {
          const expandedConditionValues = getExpandedConditionValuesByRowIndex(rowIndex);
          if (!expandedConditionValues.length) {
            return null;
          }

          return expandedConditionValues.map(({ label }) => ({
            cellData: asConditionNameChipCellData(label),
          }));
        },
      },
      [ColumnKey.VariantValue]: {
        columnConfig: {
          columnType: ColumnType.Code,
        },
        getCellData: ({ rowIndex }) => {
          const expandedConditionValues = getExpandedConditionValuesByRowIndex(rowIndex);
          if (!expandedConditionValues.length) {
            return null;
          }

          return expandedConditionValues.map(({ value }) => ({
            cellData: configEntryValueToCellData(value),
          }));
        },
      },
    }),
    [getExpandedConditionValuesByRowIndex],
  );

  const rowExpansion = useMemo(() => {
    if (!isTargetingConfigsEnabled) {
      return undefined;
    }

    return {
      isRowExpandable,
      expandedRowColumnsByColumn,
      defaultExpandedRowKeys,
    };
  }, [
    defaultExpandedRowKeys,
    expandedRowColumnsByColumn,
    isRowExpandable,
    isTargetingConfigsEnabled,
  ]);

  const tableExpansionKey = useMemo(() => {
    return defaultExpandedRowKeys.join('\0') || 'flat';
  }, [defaultExpandedRowKeys]);

  return (
    <GenericTableV2
      key={tableExpansionKey}
      rowData={rowData}
      columnConfigs={columnConfigs}
      tableConfig={tableConfig}
      classes={{ tableContainer }}
      getRowKey={getRowKey}
      rowExpansion={rowExpansion}
      isDataLoading={isDataLoading}
      isResponseFailed={false}
      isUserForbidden={false}
    />
  );
};

export default VariantsTable;
