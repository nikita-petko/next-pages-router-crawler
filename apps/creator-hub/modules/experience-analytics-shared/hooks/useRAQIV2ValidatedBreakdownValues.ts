import { useMemo } from 'react';
import type { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { RAQIV2BreakdownValue } from '@modules/clients/analytics';

type TValidatedRAQIV2BreakdownValue<T extends RAQIV2Dimension, TDimValues extends string> = {
  dimension: T;
  value: TDimValues;
  displayValue?: string;
};

const useRAQIV2ValidatedBreakdownValues = <T extends RAQIV2Dimension, TDimValues extends string>(
  dimension: T,
  breakdownValues: RAQIV2BreakdownValue[],
): TValidatedRAQIV2BreakdownValue<T, TDimValues>[] => {
  const validatedBreakdownValues: TValidatedRAQIV2BreakdownValue<T, TDimValues>[] = useMemo(
    () =>
      breakdownValues
        .filter(
          (value): value is RAQIV2BreakdownValue & { value: string } =>
            value.dimension === dimension && value.value !== undefined,
        )
        .map((value) => ({
          ...value,
          dimension: value.dimension as T,
          value: value.value as TDimValues,
        })),
    [breakdownValues, dimension],
  );

  return validatedBreakdownValues;
};

export default useRAQIV2ValidatedBreakdownValues;
