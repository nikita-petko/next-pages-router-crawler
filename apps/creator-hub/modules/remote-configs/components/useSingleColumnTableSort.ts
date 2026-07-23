import {
  TableColumnConfig,
  TableSortOrder,
  TableColumnConfigWithoutSort,
} from '@modules/charts-generic';
import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import { useMemo } from 'react';

export default function useSingleColumnTableSort<
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
>(
  currentSort: { order: TableSortOrder; key: TSortableColumnKey },
  onSortChange: (key: TSortableColumnKey, order: TableSortOrder) => void,
  columnConfigs: readonly TableColumnConfigWithoutSort<TColumnKey>[],
  allowedKeys: readonly TSortableColumnKey[],
  defaultSortOrder: Record<TSortableColumnKey, TableSortOrder>,
): {
  configsWithSort: TableColumnConfig<TColumnKey>[];
  order: TableSortOrder;
  orderBy: TColumnKey;
} {
  const { order, key: currentSortKey } = currentSort;

  const configsWithSort = useMemo(() => {
    return columnConfigs.map((current) => {
      const { columnKey } = current;
      if (!isValidArrayEnumValue(allowedKeys, columnKey)) return current;

      const direction = currentSortKey === columnKey ? order : defaultSortOrder[columnKey];
      const onClick = (key: TColumnKey) => {
        if (!isValidArrayEnumValue(allowedKeys, key)) return;

        if (key === currentSortKey) {
          onSortChange(
            key,
            order === TableSortOrder.asc ? TableSortOrder.desc : TableSortOrder.asc,
          );
        } else {
          onSortChange(key, defaultSortOrder[key]);
        }
      };

      return { ...current, columnKey, sort: { direction, onClick } };
    });
  }, [allowedKeys, columnConfigs, currentSortKey, defaultSortOrder, onSortChange, order]);

  return {
    configsWithSort,
    order,
    orderBy: currentSortKey,
  };
}
