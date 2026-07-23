import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { CellDataType } from '@modules/charts-generic/tables/types/GenericTableType';
import type { DownFunnelColumnKey } from './configs';
import { orderedDownFunnelColumnKeys, SpecialCohortColumnKey } from './configs';

/**
 * Initialize an empty down funnel row with the given cohort.
 * @param cohort - The cohort to initialize the row for.
 * @returns A map of column keys to cell data.
 */
const initEmptyDownFunnelRow = (cohort: string) => {
  const row = new Map<DownFunnelColumnKey, CellDataType>();
  orderedDownFunnelColumnKeys.forEach((columnKey) => {
    if (columnKey === SpecialCohortColumnKey.Cohort) {
      row.set(columnKey, { type: ColumnType.Text, value: cohort });
    } else {
      row.set(columnKey, { type: ColumnType.Number, value: Number.NaN });
    }
  });
  return row;
};

export default initEmptyDownFunnelRow;
