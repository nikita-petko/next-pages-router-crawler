import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { NumberContext } from '@modules/charts-generic/charts/numberFormatters';
import {
  ChartUnit,
  ChartUnitAggregationType,
} from '@modules/charts-generic/charts/types/ChartTypes';
import type { TableColumnConfig } from '@modules/charts-generic/tables/types/GenericColumnType';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { TableConfig } from '@modules/charts-generic/tables/types/GenericTableType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { DataSharingEntityType } from '../utils/formDiffUtils';

export enum ExperiencesTableColumnKey {
  Name = 'Name',
  LastUpdatedDate = 'LastUpdatedDate',
  Playability = 'Playability',
  Selected = 'selected',
}

export enum AvatarTableColumnKey {
  Name = 'Name',
  CreatedDate = 'CreatedDate',
  Price = 'Price',
  Selected = 'selected',
}

export enum AssetTableColumnKey {
  Name = 'Name',
  LastUpdatedDate = 'LastUpdatedDate',
  Price = 'Price',
  Selected = 'selected',
}

type TableRowCommon = {
  id: number;
  selected: boolean;
  license: string[];
  entityType: DataSharingEntityType;
};

export type ExperiencesTableRow = TableRowCommon & {
  [ExperiencesTableColumnKey.Name]: string;
  [ExperiencesTableColumnKey.LastUpdatedDate]: string;
  [ExperiencesTableColumnKey.Playability]: string;
};

export type AvatarTableRow = TableRowCommon & {
  [AvatarTableColumnKey.Name]: string;
  [AvatarTableColumnKey.CreatedDate]: string;
  [AvatarTableColumnKey.Price]: number;
};

export type AssetTableRow = TableRowCommon & {
  [AssetTableColumnKey.Name]: string;
  [AssetTableColumnKey.LastUpdatedDate]: string;
  [AssetTableColumnKey.Price]: number;
};

export type EntityTableRow = ExperiencesTableRow | AvatarTableRow | AssetTableRow;

export type SettingsTableConfigType =
  | TableConfig<ExperiencesTableColumnKey>
  | TableConfig<AvatarTableColumnKey>
  | TableConfig<AssetTableColumnKey>;

export type EntityTableColumnConfig = TableColumnConfig<
  ExperiencesTableColumnKey | AvatarTableColumnKey | AssetTableColumnKey
>;

export const SettingsTableConfig: SettingsTableConfigType = {
  columnDivider: true,
};

export const SettingsExperiencesTableColumnConfigs: TableColumnConfig<ExperiencesTableColumnKey>[] =
  [
    {
      titleKey: translationKey('Label.SelectAll', TranslationNamespace.DataSharingSettingsV2),
      columnKey: ExperiencesTableColumnKey.Selected,
      columnType: ColumnType.Selection,
      widthWeight: 10,
    },
    {
      titleKey: translationKey('Column.Name', TranslationNamespace.DataSharingSettingsV2),
      columnKey: ExperiencesTableColumnKey.Name,
      columnType: ColumnType.Text,
      widthWeight: 50,
    },
    {
      titleKey: translationKey(
        'Column.LastUpdatedDate',
        TranslationNamespace.DataSharingSettingsV2,
      ),
      columnKey: ExperiencesTableColumnKey.LastUpdatedDate,
      columnType: ColumnType.Text,
      widthWeight: 20,
    },
    {
      titleKey: translationKey('Column.Playability', TranslationNamespace.DataSharingSettingsV2),
      columnKey: ExperiencesTableColumnKey.Playability,
      columnType: ColumnType.Text,
      widthWeight: 20,
    },
  ];

export const SettingsAssetTableColumnConfigs: TableColumnConfig<AssetTableColumnKey>[] = [
  {
    titleKey: translationKey('Label.SelectAll', TranslationNamespace.DataSharingSettingsV2),
    columnKey: AssetTableColumnKey.Selected,
    columnType: ColumnType.Selection,
    widthWeight: 10,
  },
  {
    titleKey: translationKey('Column.Name', TranslationNamespace.DataSharingSettingsV2),
    columnKey: AssetTableColumnKey.Name,
    columnType: ColumnType.Text,
    widthWeight: 50,
  },
  {
    titleKey: translationKey('Column.LastUpdatedDate', TranslationNamespace.DataSharingSettingsV2),
    columnKey: AssetTableColumnKey.LastUpdatedDate,
    columnType: ColumnType.Text,
    widthWeight: 20,
  },
  {
    titleKey: translationKey('Column.Price', TranslationNamespace.DataSharingSettingsV2),
    columnKey: AssetTableColumnKey.Price,
    columnType: ColumnType.Number,
    widthWeight: 20,
    numericFormattingSpec: {
      unit: ChartUnit.Currency,
      type: ChartUnitAggregationType.SummaryTotal,
      context: NumberContext.DataPoint,
    },
  },
];

export const SettingsAvatarTableColumnConfigs: TableColumnConfig<AvatarTableColumnKey>[] = [
  {
    titleKey: translationKey('Label.SelectAll', TranslationNamespace.DataSharingSettingsV2),
    columnKey: AvatarTableColumnKey.Selected,
    columnType: ColumnType.Selection,
    widthWeight: 10,
  },
  {
    titleKey: translationKey('Column.Name', TranslationNamespace.DataSharingSettingsV2),
    columnKey: AvatarTableColumnKey.Name,
    columnType: ColumnType.Text,
    widthWeight: 50,
  },
  {
    titleKey: translationKey('Column.CreatedDate', TranslationNamespace.DataSharingSettingsV2),
    columnKey: AvatarTableColumnKey.CreatedDate,
    columnType: ColumnType.Text,
    widthWeight: 20,
  },
  {
    titleKey: translationKey('Column.Price', TranslationNamespace.DataSharingSettingsV2),
    columnKey: AvatarTableColumnKey.Price,
    columnType: ColumnType.Number,
    widthWeight: 20,
    numericFormattingSpec: {
      unit: ChartUnit.Robux,
      type: ChartUnitAggregationType.SummaryTotal,
      context: NumberContext.DataPoint,
    },
  },
];
