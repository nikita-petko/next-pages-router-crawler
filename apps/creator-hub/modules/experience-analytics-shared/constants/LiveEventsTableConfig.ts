import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { TableColumnConfig } from '@modules/charts-generic/tables/types/GenericColumnType';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { TableConfig } from '@modules/charts-generic/tables/types/GenericTableType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export enum LiveEventsTableColumnKey {
  EventType = 'EventType',
  UserId = 'UserId',
  Timestamp = 'Timestamp',
  Event = 'Event',
}

export const LiveEventsTableConfig: TableConfig<LiveEventsTableColumnKey> = {
  stickyHeader: false,
  stickyFirstColumn: false,
  columnDivider: true,
};

export const LiveEventsTableColumnConfigs: Record<
  LiveEventsTableColumnKey,
  TableColumnConfig<LiveEventsTableColumnKey>
> = {
  [LiveEventsTableColumnKey.EventType]: {
    titleKey: translationKey('Title.Table.EventType', TranslationNamespace.Analytics),
    columnKey: LiveEventsTableColumnKey.EventType,
    columnType: ColumnType.Text,
    widthWeight: 20,
  },
  [LiveEventsTableColumnKey.UserId]: {
    titleKey: translationKey('Title.Table.UserId', TranslationNamespace.Analytics),
    columnKey: LiveEventsTableColumnKey.UserId,
    columnType: ColumnType.Number,
    widthWeight: 15,
  },
  [LiveEventsTableColumnKey.Timestamp]: {
    titleKey: translationKey('Title.Table.Timestamp', TranslationNamespace.Analytics),
    columnKey: LiveEventsTableColumnKey.Timestamp,
    columnType: ColumnType.Timestamp,
    widthWeight: 20,
  },
  [LiveEventsTableColumnKey.Event]: {
    titleKey: translationKey('Title.Table.Event', TranslationNamespace.Analytics),
    columnKey: LiveEventsTableColumnKey.Event,
    columnType: ColumnType.RawJSONString,
    widthWeight: 45,
  },
};
