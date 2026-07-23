import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type {
  CellDataType,
  GenericTableV2ExpandedRowColumnDefinition,
  GenericTableV2RowExpansionConfig,
} from '@modules/charts-generic/tables/types/GenericTableType';
import type { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import type { ErrorLogDetail } from '@modules/clients/analytics/universePerformanceRaqi';
import {
  SupportedLogSeverities,
  SupportedLogSources,
} from '@modules/clients/analytics/universePerformanceRaqi';
import type { RAQIV2TableRowID } from '@modules/experience-analytics-shared/adapters/genericRAQIV2TableAdapter';
import type {
  PaginatedColumnRequest,
  RowDataResponse,
} from '@modules/experience-analytics-shared/components/RAQIV2/table/GenericDataTable';
import type { TAnalyticsCustomTableColumnConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableColumnConfig';
import type { PaginationResponse } from '@modules/experience-analytics-shared/hooks/usePaginatedRequest';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ErrorLogStackTraceCard from './ErrorLogStackTraceCard';
import type { TopErrorLogDetailsFetcher } from './topErrorLogDetailsCache';

export const ERROR_LOG_TABLE_V2_COLUMN_KEYS = {
  count: 'errorLogTableV2.count',
  severity: 'errorLogTableV2.severity',
  source: 'errorLogTableV2.source',
  firstSeen: 'errorLogTableV2.firstSeen',
  firstSeenPlaceVersion: 'errorLogTableV2.firstSeenPlaceVersion',
  message: 'errorLogTableV2.message',
  stackTrace: 'errorLogTableV2.stackTrace',
  actions: 'errorLogTableV2.actions',
} as const;

type SecondaryColumnRequest = PaginatedColumnRequest<
  RAQIV2BreakdownValue[],
  RAQIV2TableRowID,
  string
>;
type SecondaryColumnResponse = PaginationResponse<
  RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>
>;

const extractMessageHashFromRowData = (rowData: RAQIV2BreakdownValue[]): string | undefined => {
  const hashValue = rowData.find((b) => b.dimension === RAQIV2Dimension.MessageHash)?.value;
  return typeof hashValue === 'string' && hashValue.length > 0 ? hashValue : undefined;
};

const buildDetailDrivenColumn = (
  fetcher: TopErrorLogDetailsFetcher,
  spec: {
    key: string;
    titleKey: TAnalyticsCustomTableColumnConfig['titleKey'];
    titleOverride?: string;
    columnType: ColumnType;
    widthWeight?: number;
    hidden?: boolean;
    buildCell: (detail: ErrorLogDetail | undefined) => CellDataType;
  },
): TAnalyticsCustomTableColumnConfig => ({
  key: spec.key,
  titleKey: spec.titleKey,
  titleOverride: spec.titleOverride,
  columnType: spec.columnType,
  widthWeight: spec.widthWeight,
  hidden: spec.hidden,
  getData: async (request: SecondaryColumnRequest): Promise<SecondaryColumnResponse> => {
    const { rows } = request;
    if (rows.length === 0) {
      return { values: [], total: 0, nextPaginationToken: '' };
    }

    const hashes: string[] = [];
    rows.forEach((row) => {
      const hash = extractMessageHashFromRowData(row.data);
      if (hash) {
        hashes.push(hash);
      }
    });

    const detailsByHash = await fetcher(hashes);

    const values: RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>[] = rows.map(
      ({ id, data }) => {
        const hash = extractMessageHashFromRowData(data);
        const detail = hash ? detailsByHash.get(hash) : undefined;
        return { rowId: id, data: spec.buildCell(detail), rowData: data };
      },
    );

    return { values, total: values.length, nextPaginationToken: '' };
  },
});

const buildSeverityCell = (detail: ErrorLogDetail | undefined): CellDataType => {
  const isWarning = detail?.logSeverity === SupportedLogSeverities.Warning;
  return {
    type: ColumnType.Status,
    chipType: 'badge',
    variant: isWarning ? 'Warning' : 'Alert',
    label: detail?.logSeverity ?? '',
    icon: isWarning ? 'icon-regular-triangle-exclamation' : 'icon-regular-circle-x',
  };
};

const buildSourceCell = (detail: ErrorLogDetail | undefined): CellDataType => {
  const source = detail?.logSource ?? null;
  let value = '';
  if (source === SupportedLogSources.Server) {
    value = 'Server';
  } else if (source === SupportedLogSources.Client) {
    value = 'Client';
  }
  return { type: ColumnType.Text, value };
};

const buildFirstSeenCell = (detail: ErrorLogDetail | undefined): CellDataType => ({
  type: ColumnType.Timestamp,
  value: detail?.firstSeenUtc ?? '',
  format: { dateStyle: 'medium', timeStyle: 'short' },
});

const buildFirstSeenPlaceVersionCell = (detail: ErrorLogDetail | undefined): CellDataType => ({
  type: ColumnType.Text,
  value:
    detail?.firstSeenPlaceVersion !== undefined && detail.firstSeenPlaceVersion !== null
      ? `V${detail.firstSeenPlaceVersion}`
      : '\u2014',
});

const buildMessageCell = (detail: ErrorLogDetail | undefined): CellDataType => ({
  type: ColumnType.Text,
  value: detail?.message ?? '',
});

const buildStackTraceCell = (detail: ErrorLogDetail | undefined): CellDataType => ({
  type: ColumnType.Text,
  value: detail?.stacktrace ?? '',
});

const expandedRowSkipSibling: GenericTableV2ExpandedRowColumnDefinition<string> = {
  columnConfig: { columnType: ColumnType.Text },
  getCellData: () => [{ skipCell: true }],
};

export const createErrorLogTableV2RowExpansion = (
  showFirstSeenColumn: boolean,
  showFirstSeenPlaceVersionColumn: boolean,
  showActionsColumn: boolean,
): GenericTableV2RowExpansionConfig<string> => ({
  expandOnRowClick: true,
  expandTogglePlacement: ERROR_LOG_TABLE_V2_COLUMN_KEYS.message,
  isRowExpandable: (rowInfo) => {
    const cell = rowInfo.get(ERROR_LOG_TABLE_V2_COLUMN_KEYS.stackTrace);
    return cell?.type === ColumnType.Text && cell.value.trim().length > 0;
  },
  expandedRowColumnsByColumn: {
    [ERROR_LOG_TABLE_V2_COLUMN_KEYS.count]: {
      columnConfig: { columnType: ColumnType.Other },
      getCellData: ({ rowInfo, columnCount }) => {
        const cell = rowInfo.get(ERROR_LOG_TABLE_V2_COLUMN_KEYS.stackTrace);
        const text = cell?.type === ColumnType.Text ? cell.value : '';
        return [
          {
            colSpan: columnCount,
            cellData: {
              type: ColumnType.Other,
              value: <ErrorLogStackTraceCard text={text} />,
            },
          },
        ];
      },
    },
    [ERROR_LOG_TABLE_V2_COLUMN_KEYS.severity]: expandedRowSkipSibling,
    [ERROR_LOG_TABLE_V2_COLUMN_KEYS.source]: expandedRowSkipSibling,
    ...(showFirstSeenColumn
      ? { [ERROR_LOG_TABLE_V2_COLUMN_KEYS.firstSeen]: expandedRowSkipSibling }
      : {}),
    ...(showFirstSeenPlaceVersionColumn
      ? { [ERROR_LOG_TABLE_V2_COLUMN_KEYS.firstSeenPlaceVersion]: expandedRowSkipSibling }
      : {}),
    ...(showActionsColumn
      ? { [ERROR_LOG_TABLE_V2_COLUMN_KEYS.actions]: expandedRowSkipSibling }
      : {}),
    [ERROR_LOG_TABLE_V2_COLUMN_KEYS.message]: expandedRowSkipSibling,
  },
});

export type ErrorLogActionsConfig = {
  /** Resolved label for the "Ignore error" menu option. */
  ignoreLabel: string;
  /** Creates an ignore rule for the given error message. */
  onIgnoreError: (message: string) => void;
};

export const buildErrorLogTableV2CustomColumns = (
  fetcher: TopErrorLogDetailsFetcher,
  showFirstSeenColumn: boolean,
  showFirstSeenPlaceVersionColumn: boolean,
  actionsConfig?: ErrorLogActionsConfig,
): TAnalyticsCustomTableColumnConfig[] => [
  buildDetailDrivenColumn(fetcher, {
    key: ERROR_LOG_TABLE_V2_COLUMN_KEYS.severity,
    titleKey: translationKey('ErrorLogTable.Header.Severity', TranslationNamespace.Analytics),
    columnType: ColumnType.Status,
    widthWeight: 10,
    buildCell: buildSeverityCell,
  }),
  buildDetailDrivenColumn(fetcher, {
    key: ERROR_LOG_TABLE_V2_COLUMN_KEYS.source,
    titleKey: translationKey('ErrorLogTable.Header.Type', TranslationNamespace.Analytics),
    columnType: ColumnType.Text,
    widthWeight: 8,
    buildCell: buildSourceCell,
  }),
  ...(showFirstSeenColumn
    ? [
        buildDetailDrivenColumn(fetcher, {
          key: ERROR_LOG_TABLE_V2_COLUMN_KEYS.firstSeen,
          titleKey: translationKey(
            'ErrorLogTable.Header.FirstSeen',
            TranslationNamespace.Analytics,
          ),
          columnType: ColumnType.Timestamp,
          widthWeight: 16,
          buildCell: buildFirstSeenCell,
        }),
      ]
    : []),
  ...(showFirstSeenPlaceVersionColumn
    ? [
        buildDetailDrivenColumn(fetcher, {
          key: ERROR_LOG_TABLE_V2_COLUMN_KEYS.firstSeenPlaceVersion,
          titleKey: translationKey(
            'ErrorLogTable.Header.FirstSeenPlaceVersion',
            TranslationNamespace.Analytics,
          ),
          columnType: ColumnType.Text,
          widthWeight: 12,
          buildCell: buildFirstSeenPlaceVersionCell,
        }),
      ]
    : []),
  buildDetailDrivenColumn(fetcher, {
    key: ERROR_LOG_TABLE_V2_COLUMN_KEYS.message,
    titleKey: translationKey('ErrorLogTable.Header.Message', TranslationNamespace.Analytics),
    columnType: ColumnType.Text,
    widthWeight:
      72 -
      (showFirstSeenColumn ? 16 : 0) -
      (showFirstSeenPlaceVersionColumn ? 12 : 0) -
      (actionsConfig ? 4 : 0),
    buildCell: buildMessageCell,
  }),
  buildDetailDrivenColumn(fetcher, {
    key: ERROR_LOG_TABLE_V2_COLUMN_KEYS.stackTrace,
    titleKey: translationKey('ErrorLogTable.Header.StackTrace', TranslationNamespace.Analytics),
    columnType: ColumnType.Text,
    hidden: true,
    buildCell: buildStackTraceCell,
  }),
  ...(actionsConfig
    ? [
        buildDetailDrivenColumn(fetcher, {
          key: ERROR_LOG_TABLE_V2_COLUMN_KEYS.actions,
          titleKey: translationKey('Title.Table.Actions', TranslationNamespace.Analytics),
          titleOverride: '',
          columnType: ColumnType.Actions,
          widthWeight: 4,
          buildCell: (detail) => {
            const message = detail?.message ?? '';
            return {
              type: ColumnType.Actions,
              actions: [
                {
                  actionType: 'ignore',
                  actionOn: message,
                  onActionInvoked: actionsConfig.onIgnoreError,
                  renderedAsInNonCompactTable: 'menu-item',
                  displayLabel: actionsConfig.ignoreLabel,
                  disabled: !message.trim(),
                },
              ],
            };
          },
        }),
      ]
    : []),
];
