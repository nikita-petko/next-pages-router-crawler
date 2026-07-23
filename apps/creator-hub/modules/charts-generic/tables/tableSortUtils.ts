import { ColumnType } from './types/GenericColumnType';
import { CellDataType } from './types/GenericTableType';
import { TableSortOrder } from './types/TableSort';

type TSortableType = string | number;

const getSortValue = <TActionType extends string, TActionOn = string>(
  item: CellDataType<TActionType, TActionOn>,
): TSortableType | null => {
  const { type } = item;
  switch (type) {
    case ColumnType.BoldText:
    case ColumnType.Text:
    case ColumnType.Number:
    case ColumnType.TextWithDisplayValue:
    case ColumnType.RawJSONString:
    case ColumnType.TextWithIcon:
    case ColumnType.Code:
      return item.value;
    case ColumnType.TextWithTooltip:
    case ColumnType.TextWithLink:
      return item.text;
    case ColumnType.Date:
      return item.value.getTime();
    case ColumnType.Timestamp:
      return typeof item.value === 'string' || typeof item.value === 'number'
        ? new Date(item.value).getTime()
        : item.value.getTime();
    case ColumnType.Selection:
      if (item.checked) return 2;
      return item.indeterminate ? 1 : 0;
    case ColumnType.Status:
      return item.label;
    case ColumnType.Image:
    case ColumnType.Actions:
    case ColumnType.CodeDiff:
    case ColumnType.Other:
      return null;
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unhandled column type: ${exhaustiveCheck}`);
    }
  }
};

const isNumeric = (val: TSortableType): boolean => {
  return !Number.isNaN(Number(val));
};

export function descendingComparator<
  TColumnKey extends string | number,
  TActionType extends string,
  TActionOn = string,
>(
  a: Map<TColumnKey, CellDataType<TActionType, TActionOn>>,
  b: Map<TColumnKey, CellDataType<TActionType, TActionOn>>,
  orderBy: TColumnKey,
) {
  const itemA = a.get(orderBy);
  const itemB = b.get(orderBy);
  const valueA = itemA !== undefined ? getSortValue(itemA) : null;
  const valueB = itemB !== undefined ? getSortValue(itemB) : null;
  if (valueA !== null && valueB !== null) {
    if (!isNumeric(valueA) && isNumeric(valueB)) {
      return 1;
    }
    if (isNumeric(valueA) && !isNumeric(valueB)) {
      return -1;
    }
    if (isNumeric(valueA) && isNumeric(valueB)) {
      return Number(valueB) - Number(valueA);
    }
    if (valueB < valueA) {
      return -1;
    }
    if (valueB > valueA) {
      return 1;
    }
    return 0;
  }
  return 0;
}

export function getComparator<
  TColumnKey extends string | number,
  TActionType extends string,
  TActionOn = string,
>(
  order: TableSortOrder,
  orderBy: TColumnKey,
): (
  a: Map<TColumnKey, CellDataType<TActionType, TActionOn>>,
  b: Map<TColumnKey, CellDataType<TActionType, TActionOn>>,
) => number {
  return order === TableSortOrder.desc
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}
