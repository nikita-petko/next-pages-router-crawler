import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { AlertAnnotationSeverity } from '@modules/charts-generic/charts/types/Annotations';
import type { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';

export const AlertAnnotationSeverityDimension = [
  RAQIV2Dimension.MemoryStoreErrorRateAlertSeverity,
  RAQIV2Dimension.MemoryStoreMemoryUsageAlertSeverity,
  RAQIV2Dimension.MemoryStoreThrottlingAlertSeverity,
] as const;
export type TAlertAnnotationSeverityDimension = (typeof AlertAnnotationSeverityDimension)[number];

export const isAlertAnnotationSeverityDimension = (
  dimension: TRAQIV2Dimension,
): dimension is TAlertAnnotationSeverityDimension => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
  return AlertAnnotationSeverityDimension.includes(dimension as TAlertAnnotationSeverityDimension);
};

export type TSeverityBreakdownValue = {
  dimension: TAlertAnnotationSeverityDimension;
  value: AlertAnnotationSeverity;
};
export const isSeverityBreakdownValue = (
  breakdownValue: RAQIV2BreakdownValue,
): breakdownValue is TSeverityBreakdownValue => {
  const { dimension, value } = breakdownValue;
  return (
    !!dimension &&
    !!value &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
    AlertAnnotationSeverityDimension.includes(dimension as TAlertAnnotationSeverityDimension) &&
    isValidEnumValue(AlertAnnotationSeverity, value)
  );
};
