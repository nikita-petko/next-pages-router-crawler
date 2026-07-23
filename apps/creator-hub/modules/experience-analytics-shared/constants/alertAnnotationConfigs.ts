import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import { AlertAnnotationSeverity } from '@modules/charts-generic';
import { TRAQIV2Dimension, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';

export const AlertAnnotationSeverityDimension = [
  RAQIV2Dimension.MemoryStoreErrorRateAlertSeverity,
  RAQIV2Dimension.MemoryStoreMemoryUsageAlertSeverity,
  RAQIV2Dimension.MemoryStoreThrottlingAlertSeverity,
] as const;
export type TAlertAnnotationSeverityDimension = (typeof AlertAnnotationSeverityDimension)[number];

export const isAlertAnnotationSeverityDimension = (
  dimension: TRAQIV2Dimension,
): dimension is TAlertAnnotationSeverityDimension => {
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
    AlertAnnotationSeverityDimension.includes(dimension as TAlertAnnotationSeverityDimension) &&
    isValidEnumValue(AlertAnnotationSeverity, value)
  );
};
