import React, { useMemo } from 'react';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  CellDataType,
  ColumnType,
  GenericTableV2,
  TableColumnConfig,
} from '@modules/charts-generic';
import { makeStyles } from '@rbx/ui';
import { configEntryToStringValueForTable } from '../../utils/configEntryToStringValue';
import { ValidConfigExperimentVariant } from '../../api/validExperimentationTypes';

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

const VariantsTable = ({ variants }: { variants: ValidConfigExperimentVariant[] }) => {
  const {
    classes: { tableContainer },
  } = useStyles();
  const rowData = useMemo(() => {
    return variants.map(({ configEntry, label, weight }) => {
      return new Map<ColumnKey, CellDataType>([
        [ColumnKey.VariantName, { type: ColumnType.Text, value: label }],
        [ColumnKey.VariantWeight, { type: ColumnType.Text, value: `${weight}%` }],
        [
          ColumnKey.VariantValue,
          {
            type: ColumnType.Code,
            ...configEntryToStringValueForTable(configEntry.entryValue),
          },
        ],
      ]);
    });
  }, [variants]);

  return (
    <GenericTableV2
      rowData={rowData}
      columnConfigs={columnConfigs}
      tableConfig={tableConfig}
      classes={{ tableContainer }}
      isDataLoading={false}
      isResponseFailed={false}
      isUserForbidden={false}
    />
  );
};

export default VariantsTable;
