import { translationKey } from '@modules/analytics-translations';
import { ColumnType, TableColumnConfig, TableSortOrder } from '@modules/charts-generic';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export enum HistoryTableParentColumn {
  Collapse = 'collapse',
  Version = 'version',
  Date = 'date',
  ChangedBy = 'changedBy',
  PublishMessage = 'publishMessage',
  Restore = 'restore',
}

const orderedParentColumnKeys = [
  HistoryTableParentColumn.Collapse,
  HistoryTableParentColumn.Version,
  HistoryTableParentColumn.Date,
  HistoryTableParentColumn.ChangedBy,
  HistoryTableParentColumn.PublishMessage,
  HistoryTableParentColumn.Restore,
] as const;

const parentColumnConfigByColumnKey: Record<
  HistoryTableParentColumn,
  TableColumnConfig<HistoryTableParentColumn>
> = {
  [HistoryTableParentColumn.Collapse]: {
    columnKey: HistoryTableParentColumn.Collapse,
    columnType: ColumnType.Actions,
    titleKey: translationKey(
      'Table.Column.Title.Collapse',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    endAdormentColumnKeyInCompactView: HistoryTableParentColumn.Restore,
  },
  [HistoryTableParentColumn.Version]: {
    columnKey: HistoryTableParentColumn.Version,
    columnType: ColumnType.Text,
    titleKey: translationKey(
      'Table.Column.Title.Version',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    columnAlignment: 'left',
  },
  [HistoryTableParentColumn.Date]: {
    columnKey: HistoryTableParentColumn.Date,
    columnType: ColumnType.Timestamp,
    titleKey: translationKey(
      'Table.Column.Title.Date',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    sort: {
      direction: TableSortOrder.desc,
    },
  },
  [HistoryTableParentColumn.ChangedBy]: {
    columnKey: HistoryTableParentColumn.ChangedBy,
    columnType: ColumnType.Text,
    titleKey: translationKey(
      'Table.Column.Title.ChangedBy',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  },
  [HistoryTableParentColumn.PublishMessage]: {
    columnKey: HistoryTableParentColumn.PublishMessage,
    columnType: ColumnType.Text,
    titleKey: translationKey(
      'Table.Column.Title.PublishMessage',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    widthWeight: 30,
  },
  [HistoryTableParentColumn.Restore]: {
    columnKey: HistoryTableParentColumn.Restore,
    columnType: ColumnType.Actions,
    titleKey: translationKey(
      'Table.Column.Title.Restore',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    widthWeight: 30,
    columnAlignment: 'right',
  },
};

export const orderedParentColumnConfigs: TableColumnConfig<HistoryTableParentColumn>[] =
  orderedParentColumnKeys.map((key) => parentColumnConfigByColumnKey[key]);
