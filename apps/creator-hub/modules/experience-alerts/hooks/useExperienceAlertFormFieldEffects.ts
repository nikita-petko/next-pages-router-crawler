import { useEffect, useRef, type RefObject } from 'react';
import type {
  FieldPath,
  UseFieldArrayReturn,
  UseFormGetFieldState,
  UseFormGetValues,
  UseFormSetValue,
  UseFormTrigger,
} from 'react-hook-form';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { ExperienceAlertFilterRowValues, ExperienceAlertFormValues } from '../constants/types';
import {
  getAlertBreakdownDimensionsForMetric,
  getAlertFilterDimensionsForMetric,
} from '../utils/analyticsAlertFormUtils';

export type UseExperienceAlertFormCrossFieldEffectsParams = {
  metric: ExperienceAlertFormValues['metric'];
  interval: ExperienceAlertFormValues['interval'];
  evaluationMode: ExperienceAlertFormValues['evaluationMode'];
  /** `formState.isSubmitted` from the surrounding `useForm`; once submitted, errors should
   * continue to refresh as related fields change even on never-touched fields. */
  isSubmitted: boolean;
  getFieldState: UseFormGetFieldState<ExperienceAlertFormValues>;
  getValues: UseFormGetValues<ExperienceAlertFormValues>;
  setValue: UseFormSetValue<ExperienceAlertFormValues>;
  trigger: UseFormTrigger<ExperienceAlertFormValues>;
};

/**
 * Re-validates a dependent field, but only if the user has already interacted with it
 * (or the form has been submitted at least once). Matches the surrounding form's
 * `mode: 'onTouched'` policy — `trigger()` itself fires validation regardless of
 * touched state, which would surface a fresh "required" error on a field the user
 * never touched (e.g. selecting a granularity used to immediately mark
 * `consecutiveOccurrences` as required, even before the user clicked into it).
 */
const triggerIfTouchedOrSubmitted = (
  field: FieldPath<ExperienceAlertFormValues>,
  trigger: UseFormTrigger<ExperienceAlertFormValues>,
  getFieldState: UseFormGetFieldState<ExperienceAlertFormValues>,
  isSubmitted: boolean,
): void => {
  if (!isSubmitted && !getFieldState(field).isTouched) {
    return;
  }
  trigger(field).catch(() => {});
};

/**
 * When metric or interval (granularity) changes, updates breakdown dimension when invalid for
 * the new metric and re-validates fields whose rules depend on metric or interval.
 * Breakdown categories are pruned to current enum options in BreakdownCategoriesSelect.
 *
 * The evaluation-mode switch re-validates the threshold value field because PoP and Absolute
 * use different parse strategies: a value that survived `parsesAsNumber` under the previous
 * mode is not guaranteed to survive the new one (e.g. memory-byte literal "2.5GB" is fine
 * for Absolute on a memory metric, but the suffix becomes nonsense in PoP percent semantics).
 *
 * Cross-field re-validations honor `mode: 'onTouched'`: a dependent field is re-validated
 * only after the user has touched it (or once the form has been submitted), so toggling
 * one control never surfaces a "required" error on a sibling the user has not yet visited.
 */
export function useExperienceAlertFormCrossFieldEffects({
  metric,
  interval,
  evaluationMode,
  isSubmitted,
  getFieldState,
  getValues,
  setValue,
  trigger,
}: UseExperienceAlertFormCrossFieldEffectsParams): void {
  const prevMetricRef = useRef(metric);
  useEffect(() => {
    if (prevMetricRef.current === metric) {
      return;
    }
    prevMetricRef.current = metric;

    if (!metric) {
      setValue('breakdownDimension', null);
      setValue('breakdownCategories', []);
    } else {
      const allowedBreakdown = getAlertBreakdownDimensionsForMetric(metric);
      const breakdownDimension = getValues('breakdownDimension');
      if (breakdownDimension != null && !allowedBreakdown.includes(breakdownDimension)) {
        setValue('breakdownDimension', null);
        setValue('breakdownCategories', []);
      }
    }

    triggerIfTouchedOrSubmitted('interval', trigger, getFieldState, isSubmitted);
  }, [metric, getValues, setValue, trigger, getFieldState, isSubmitted]);

  const prevIntervalRef = useRef(interval);
  useEffect(() => {
    if (prevIntervalRef.current === interval) {
      return;
    }
    prevIntervalRef.current = interval;
    triggerIfTouchedOrSubmitted('consecutiveOccurrences', trigger, getFieldState, isSubmitted);
  }, [interval, trigger, getFieldState, isSubmitted]);

  const prevEvaluationModeRef = useRef(evaluationMode);
  useEffect(() => {
    if (prevEvaluationModeRef.current === evaluationMode) {
      return;
    }
    prevEvaluationModeRef.current = evaluationMode;
    triggerIfTouchedOrSubmitted('value', trigger, getFieldState, isSubmitted);
  }, [evaluationMode, trigger, getFieldState, isSubmitted]);
}

const isPristineEmptyFilterRow = (row: ExperienceAlertFilterRowValues): boolean =>
  row.dimension === '' && row.values.length === 0;

export type ExperienceAlertFilterRowField = UseFieldArrayReturn<
  ExperienceAlertFormValues,
  'filters'
>['fields'][number];

export type UseExperienceAlertFilterRowsEffectsParams = {
  metric: ExperienceAlertFormValues['metric'];
  fields: ExperienceAlertFilterRowField[];
  getValues: UseFormGetValues<ExperienceAlertFormValues>;
  setValue: UseFormSetValue<ExperienceAlertFormValues>;
  trigger: UseFormTrigger<ExperienceAlertFormValues>;
};

export type UseExperienceAlertFilterRowsEffectsResult = {
  clearedFilterDimensionByFieldIdRef: RefObject<Map<string, TRAQIV2Dimension>>;
  clearedFilterRowIndexRef: RefObject<Set<number>>;
};

/**
 * Keeps filter rows and validation bookkeeping in sync when the alert metric changes
 * or when filter field-array row ids/order change.
 */
export function useExperienceAlertFilterRowsEffects({
  metric,
  fields,
  getValues,
  setValue,
  trigger,
}: UseExperienceAlertFilterRowsEffectsParams): UseExperienceAlertFilterRowsEffectsResult {
  const clearedFilterDimensionByFieldIdRef = useRef(new Map<string, TRAQIV2Dimension>());
  const clearedFilterRowIndexRef = useRef(new Set<number>());

  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  const prevMetricRef = useRef(metric);
  useEffect(() => {
    if (prevMetricRef.current === metric) {
      return;
    }
    prevMetricRef.current = metric;

    const fieldList = fieldsRef.current;

    if (!metric) {
      clearedFilterDimensionByFieldIdRef.current.clear();
      clearedFilterRowIndexRef.current.clear();
      setValue('filters', []);
      return;
    }

    const filters = getValues('filters');
    const allowed = getAlertFilterDimensionsForMetric(metric);
    const currentIds = new Set(fieldList.map((f) => f.id));
    [...clearedFilterDimensionByFieldIdRef.current.keys()].forEach((id) => {
      if (!currentIds.has(id)) {
        clearedFilterDimensionByFieldIdRef.current.delete(id);
      }
    });

    const nextFilters: ExperienceAlertFilterRowValues[] = filters.map((row, i) => {
      const id = fieldList[i]?.id;
      if (!id || isPristineEmptyFilterRow(row)) {
        return row;
      }

      if (row.dimension && !allowed.includes(row.dimension)) {
        clearedFilterDimensionByFieldIdRef.current.set(id, row.dimension);
        return { dimension: '' as const, values: [] };
      }
      if (row.dimension) {
        clearedFilterDimensionByFieldIdRef.current.delete(id);
      }
      return row;
    });

    const filtersChanged = nextFilters.some((row, i) => row !== filters[i]);
    if (filtersChanged) {
      setValue('filters', nextFilters, { shouldDirty: true });
    }

    clearedFilterRowIndexRef.current.clear();
    fieldList.forEach((f, i) => {
      if (clearedFilterDimensionByFieldIdRef.current.has(f.id)) {
        clearedFilterRowIndexRef.current.add(i);
      }
    });

    const triggerPaths: FieldPath<ExperienceAlertFormValues>[] = [];
    filters.forEach((row, i) => {
      if (!isPristineEmptyFilterRow(row)) {
        triggerPaths.push(`filters.${i}.dimension`, `filters.${i}.values`);
      }
    });
    if (triggerPaths.length > 0) {
      Promise.all(triggerPaths.map((path) => trigger(path))).catch(() => {});
    }
  }, [metric, getValues, setValue, trigger]);

  const fieldIdsKey = fields.map((f) => f.id).join('|');
  useEffect(() => {
    const list = fieldsRef.current;
    clearedFilterRowIndexRef.current.clear();
    list.forEach((f, i) => {
      if (clearedFilterDimensionByFieldIdRef.current.has(f.id)) {
        clearedFilterRowIndexRef.current.add(i);
      }
    });
  }, [fieldIdsKey]);

  return { clearedFilterDimensionByFieldIdRef, clearedFilterRowIndexRef };
}
