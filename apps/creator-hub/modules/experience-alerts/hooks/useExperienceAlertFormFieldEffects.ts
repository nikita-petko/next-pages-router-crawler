import { useEffect, useRef, type RefObject } from 'react';
import type {
  FieldPath,
  UseFieldArrayReturn,
  UseFormGetValues,
  UseFormSetValue,
  UseFormTrigger,
} from 'react-hook-form';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import {
  getAlertBreakdownDimensionsForMetric,
  getAlertFilterDimensionsForMetric,
} from '../constants/alertFormConstants';
import type { ExperienceAlertFilterRowValues, ExperienceAlertFormValues } from '../constants/types';

export type UseExperienceAlertFormCrossFieldEffectsParams = {
  metric: ExperienceAlertFormValues['metric'];
  timeGranularity: ExperienceAlertFormValues['timeGranularity'];
  getValues: UseFormGetValues<ExperienceAlertFormValues>;
  setValue: UseFormSetValue<ExperienceAlertFormValues>;
  trigger: UseFormTrigger<ExperienceAlertFormValues>;
};

/**
 * When metric or time granularity changes, updates breakdown dimension when invalid for
 * the new metric and re-validates fields whose rules depend on metric or granularity.
 * Breakdown categories are pruned to current enum options in BreakdownCategoriesSelect.
 */
export function useExperienceAlertFormCrossFieldEffects({
  metric,
  timeGranularity,
  getValues,
  setValue,
  trigger,
}: UseExperienceAlertFormCrossFieldEffectsParams): void {
  const prevMetricRef = useRef(metric);
  useEffect(() => {
    if (prevMetricRef.current === metric) return;
    prevMetricRef.current = metric;

    if (!metric) {
      setValue('breakdownDimension', null);
    } else {
      const allowedBreakdown = getAlertBreakdownDimensionsForMetric(metric);
      const breakdownDimension = getValues('breakdownDimension');
      if (breakdownDimension != null && !allowedBreakdown.includes(breakdownDimension)) {
        setValue('breakdownDimension', null);
      }
    }

    trigger('timeGranularity').catch(() => undefined);
  }, [metric, getValues, setValue, trigger]);

  const prevTimeGranularityRef = useRef(timeGranularity);
  useEffect(() => {
    if (prevTimeGranularityRef.current === timeGranularity) return;
    prevTimeGranularityRef.current = timeGranularity;
    trigger('durationMinutes').catch(() => undefined);
  }, [timeGranularity, trigger]);
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
    if (prevMetricRef.current === metric) return;
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
      if (!currentIds.has(id)) clearedFilterDimensionByFieldIdRef.current.delete(id);
    });

    const nextFilters: ExperienceAlertFilterRowValues[] = filters.map((row, i) => {
      const id = fieldList[i]?.id;
      if (!id || isPristineEmptyFilterRow(row)) return row;

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

    const triggerPaths: string[] = [];
    filters.forEach((row, i) => {
      if (!isPristineEmptyFilterRow(row)) {
        triggerPaths.push(`filters.${i}.dimension`, `filters.${i}.values`);
      }
    });
    if (triggerPaths.length > 0) {
      Promise.all(
        triggerPaths.map((path) => trigger(path as FieldPath<ExperienceAlertFormValues>)),
      ).catch(() => undefined);
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
