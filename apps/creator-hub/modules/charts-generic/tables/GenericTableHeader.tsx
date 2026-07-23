import React, { ReactNode, useCallback, useMemo } from 'react';

import { TTableCellProps, TTableSortLabelProps, TableCell, TableSortLabel } from '@rbx/ui';
import useGenericTableStyles from './GenericTable.styles';

export type TableHeaderSort<TColumnKey> = {
  direction: TTableSortLabelProps['direction'];
  active: boolean;
  onClick?: (key: TColumnKey) => void;
};

export type GenericTableHeaderProps<TColumnKey> = {
  columnKey: TColumnKey;
  label: ReactNode;
  width: number;
  sort?: TableHeaderSort<TColumnKey>;
  align?: TTableCellProps['align'];
};

const GenericTableHeader = <TColumnKey,>({
  columnKey,
  label,
  width,
  sort,
  align,
}: GenericTableHeaderProps<TColumnKey>) => {
  const {
    classes: { sortLabelIcon },
  } = useGenericTableStyles();
  const onClickWithKey = useCallback(() => {
    if (sort && sort.onClick) {
      sort.onClick(columnKey);
    }
  }, [columnKey, sort]);
  const headerLabel = useMemo(
    () =>
      sort ? (
        <TableSortLabel
          direction={sort.direction}
          active={sort.active}
          onClick={onClickWithKey}
          classes={{ icon: sortLabelIcon }}
          data-testid='table-sort-label'>
          {label}
        </TableSortLabel>
      ) : (
        label
      ),
    [label, onClickWithKey, sort, sortLabelIcon],
  );

  return (
    <TableCell width={`${width}%`} align={align} data-testid={`table-header-${columnKey}`}>
      {headerLabel}
    </TableCell>
  );
};

export default GenericTableHeader;
