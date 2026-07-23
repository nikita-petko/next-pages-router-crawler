import { CellDataType, ColumnType } from '@modules/charts-generic';
import {
  AudienceExpansionFunnelColumnKey,
  orderedAudienceExpansionFunnelColumnKeys,
  SpecialCohortColumnKey,
} from './cohortTableConfigs';

/**
 * Initialize an empty down funnel row with the given cohort.
 * @param cohort - The cohort to initialize the row for.
 * @returns A map of column keys to cell data.
 */
const initEmptyAudienceExpansionFunnelRow = (cohort: string) => {
  const row = new Map<AudienceExpansionFunnelColumnKey, CellDataType>();
  orderedAudienceExpansionFunnelColumnKeys.forEach((columnKey) => {
    if (columnKey === SpecialCohortColumnKey.Cohort) {
      row.set(columnKey, { type: ColumnType.Text, value: cohort });
    } else {
      row.set(columnKey, { type: ColumnType.Number, value: Number.NaN });
    }
  });
  return row;
};

export default initEmptyAudienceExpansionFunnelRow;
