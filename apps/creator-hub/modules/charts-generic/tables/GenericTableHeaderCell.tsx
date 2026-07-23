import React, { useMemo, useCallback } from 'react';
import { Checkbox, TableSortLabel, useMediaQuery, useTheme } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { useTranslationWrapper } from '@modules/analytics-translations';
import GenericCellContentWithTooltip from './GenericCellContentWithTooltip';
import {
  ColumnType,
  ColumnTypeToAlign,
  resolveTableColumnTitle,
  TableColumnConfig,
} from './types/GenericColumnType';
import GenericTableCell from './GenericTableCell';
import useGenericTableHeaderCellStyles from './GenericTableHeaderCell.styles';
import formatHeaderBackgroundStyle from './formatHeaderBackgroundStyle';
import { TableSortOrder } from './types/TableSort';

const TableSortOrderToSortLabel: Record<TableSortOrder, 'asc' | 'desc'> = {
  [TableSortOrder.asc]: 'asc',
  [TableSortOrder.desc]: 'desc',
};

const defaultTabletColumnWidth = 200;

type TGenericTableHeaderCellProps<TColumnKey extends string | number> = {
  config: TableColumnConfig<TColumnKey>;
  order: TableSortOrder | undefined;
  orderBy: TColumnKey | undefined;
  onSort: (key: TColumnKey, sortOrder?: TableSortOrder) => void;
  isDataLoading?: boolean;
};
const GenericTableHeaderCell = <TColumnKey extends string | number>({
  config,
  order,
  orderBy,
  onSort,
  isDataLoading,
}: TGenericTableHeaderCellProps<TColumnKey>) => {
  const theme = useTheme();
  const isScrollableView = useMediaQuery((t) => t.breakpoints.between('Medium', 'XLarge'));
  const { translate } = useTranslationWrapper(useTranslation());
  const {
    classes: { headerCell, label, labelIcon },
  } = useGenericTableHeaderCellStyles();

  const columnWidth = useMemo(() => {
    if (!isScrollableView) {
      return config.widthWeight ? `${config.widthWeight}%` : undefined;
    }
    return defaultTabletColumnWidth;
  }, [isScrollableView, config]);

  const sortOnClick = useCallback(() => {
    if (!config.sort || isDataLoading) {
      return;
    }
    let newOrder: TableSortOrder;
    if (config.sort.isFixedOrder) {
      newOrder = config.sort.direction;
    } else if (orderBy === config.columnKey) {
      newOrder = order === TableSortOrder.desc ? TableSortOrder.asc : TableSortOrder.desc;
    } else {
      newOrder = config.sort.direction || TableSortOrder.desc;
    }
    onSort(config.columnKey, newOrder);
  }, [config, onSort, order, orderBy, isDataLoading]);

  const direction = useMemo(() => {
    if (config.sort?.isFixedOrder) {
      return TableSortOrderToSortLabel[config.sort.direction];
    }
    return orderBy === config.columnKey && order
      ? TableSortOrderToSortLabel[order]
      : TableSortOrderToSortLabel[config.sort?.direction || TableSortOrder.desc];
  }, [config, order, orderBy]);

  const cellContent = useMemo(() => {
    const { columnType, selection, titleOverride, titleKey } = config;

    if (columnType === ColumnType.Selection && selection?.headerCellSelectionData) {
      const { rowKey, checked, indeterminate, disabled, onChange } =
        selection.headerCellSelectionData;
      return (
        <Checkbox
          size='medium'
          disableRipple
          value={rowKey}
          checked={checked}
          indeterminate={indeterminate}
          disabled={disabled}
          color='secondary'
          onChange={(e, givenChecked) => {
            onChange?.(e.target.value, givenChecked);
          }}
        />
      );
    }

    return (
      <GenericCellContentWithTooltip
        content={resolveTableColumnTitle(translate, titleKey, titleOverride)}
        tooltip={config.tooltipKey ? translate(config.tooltipKey) : undefined}
        align={config.columnAlignment ?? ColumnTypeToAlign[config.columnType]}
      />
    );
  }, [config, translate]);

  return (
    <GenericTableCell
      className={headerCell}
      align={config.columnAlignment ?? ColumnTypeToAlign[config.columnType]}
      key={config.columnKey}
      width={columnWidth}
      style={formatHeaderBackgroundStyle(config, theme)}>
      {!config.sort ? (
        cellContent
      ) : (
        <TableSortLabel
          component='div'
          classes={{ root: label, icon: labelIcon }}
          active={orderBy === config.columnKey}
          disabled={isDataLoading}
          direction={direction}
          onClick={sortOnClick}>
          {cellContent}
        </TableSortLabel>
      )}
    </GenericTableCell>
  );
};
export default GenericTableHeaderCell;
