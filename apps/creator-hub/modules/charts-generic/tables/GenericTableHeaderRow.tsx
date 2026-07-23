import React, { useMemo } from 'react';
import { TableHead, TableRow, useMediaQuery, useTheme } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { useTranslationWrapper } from '@modules/analytics-translations';
import {
  ColumnTypeToAlign,
  resolveTableColumnTitle,
  TableColumnConfig,
} from './types/GenericColumnType';
import GenericTableHeaderCell from './GenericTableHeaderCell';
import GenericTableCell from './GenericTableCell';
import GenericTableRow from './GenericTableRow';
import formatHeaderBackgroundStyle from './formatHeaderBackgroundStyle';
import { TableSortOrder } from './types/TableSort';

type TGenericTableHeaderRowsProps<TColumnKey> = {
  columnConfigs: TableColumnConfig<TColumnKey>[];
  order: TableSortOrder | undefined;
  orderBy: TColumnKey | undefined;
  onSort: (key: TColumnKey, sortOrder?: TableSortOrder) => void;
  summaryRowContent?: React.ReactNode[];
  isDataLoading?: boolean;
};

const GenericTableHeaderRows = <TColumnKey extends string | number>({
  columnConfigs,
  order,
  orderBy,
  onSort,
  summaryRowContent,
  isDataLoading,
}: TGenericTableHeaderRowsProps<TColumnKey>) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const theme = useTheme();
  const isCompactView = useMediaQuery((t) => t.breakpoints.down('Medium'));
  const showSummaryRow = !!summaryRowContent?.length;
  const showHeaderRow = !isCompactView;

  const { filteredSummaryRowContent, filteredColumnConfigs } = useMemo(() => {
    if (!showSummaryRow) {
      return {};
    }

    // filter out empty cells in summary row for compact view so they don't take up space
    const filterdRowContent: React.ReactNode[] = [];
    const filteredConfigs: TableColumnConfig<TColumnKey>[] = [];
    summaryRowContent.forEach((content, colIndex) => {
      const config = columnConfigs[colIndex];
      if (content && !config.hidden) {
        filterdRowContent.push(content);
        filteredConfigs.push(config);
      }
    });

    return {
      filteredSummaryRowContent: isCompactView ? filterdRowContent : summaryRowContent,
      filteredColumnConfigs: isCompactView ? filteredConfigs : columnConfigs,
    };
  }, [columnConfigs, isCompactView, showSummaryRow, summaryRowContent]);

  if (!showHeaderRow && !showSummaryRow) {
    return null;
  }

  return (
    <TableHead>
      {showHeaderRow && (
        <TableRow>
          {columnConfigs
            .filter((config) => !config.hidden)
            .map((config) => (
              <GenericTableHeaderCell
                key={config.columnKey}
                config={config}
                order={order}
                orderBy={orderBy}
                onSort={onSort}
                isDataLoading={isDataLoading}
              />
            ))}
        </TableRow>
      )}
      {showSummaryRow && (
        <GenericTableRow>
          {filteredSummaryRowContent?.map((content, colIndex) => {
            const config = filteredColumnConfigs[colIndex];
            const title = resolveTableColumnTitle(translate, config.titleKey, config.titleOverride);
            return (
              <GenericTableCell
                align={config.columnAlignment ?? ColumnTypeToAlign[config.columnType]}
                key={config.columnKey}
                mobileLabel={colIndex === 0 ? undefined : title}
                style={formatHeaderBackgroundStyle(config, theme)}>
                {content}
              </GenericTableCell>
            );
          })}
        </GenericTableRow>
      )}
    </TableHead>
  );
};

export default GenericTableHeaderRows;
