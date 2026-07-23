import { FC, useCallback, useMemo } from 'react';
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Button, Dropdown, IconButton, Menu, MenuItem } from '@rbx/foundation-ui';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RAQIV2ChartResource } from '@modules/clients/analytics';
import {
  getDimensionRenderer,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import {
  getAlertFilterDimensionsForMetric,
  uiAlertMetricToApiMetrics,
} from '../../constants/alertFormConstants';
import type { ExperienceAlertFormValues } from '../../constants/types';
import {
  AlertFormValidationError,
  getAlertFormValidationErrorMsg,
} from '../../constants/validationErrorMessages';
import { useExperienceAlertFilterRowsEffects } from '../../hooks/useExperienceAlertFormFieldEffects';
import { ExperienceAlertFilterRowValuesCell } from './ExperienceAlertFilterRowValuesField';

const NS = TranslationNamespace.ExperienceAlerts;

export type ExperienceAlertFilterRowsProps = {
  metric: ExperienceAlertFormValues['metric'];
  resource: RAQIV2ChartResource;
};

const ExperienceAlertFilterRows: FC<ExperienceAlertFilterRowsProps> = ({ metric, resource }) => {
  const { control, setValue, getValues, trigger } = useFormContext<ExperienceAlertFormValues>();

  const { fields, append, remove } = useFieldArray({ control, name: 'filters' });
  const { clearedFilterDimensionByFieldIdRef, clearedFilterRowIndexRef } =
    useExperienceAlertFilterRowsEffects({
      metric,
      fields,
      getValues,
      setValue,
      trigger,
    });
  const contextMetrics = useMemo(() => (metric ? uiAlertMetricToApiMetrics(metric) : []), [metric]);
  const filterDimensions = useMemo(
    () => (metric ? getAlertFilterDimensionsForMetric(metric) : []),
    [metric],
  );

  const { translate } = useRAQIV2TranslationDependencies();

  const filtersWatch = useWatch({ control, name: 'filters' });

  const onAddFilter = useCallback(() => {
    append({ dimension: '', values: [] });
  }, [append]);

  return (
    <div className='flex flex-col gap-medium'>
      <span className='text-label-medium content-emphasis'>
        {translate(translationKey('Label.Filters', NS))}
      </span>
      {fields.map((fieldRow, index) => {
        const fieldId = fieldRow.id;
        const rowDimension = filtersWatch?.[index]?.dimension ?? '';
        const filterDimensionRules = {
          validate: (dim: TRAQIV2Dimension | '') => {
            if (!metric) return true;
            if (dim !== '') {
              if (!filterDimensions.includes(dim)) {
                return getAlertFormValidationErrorMsg(
                  AlertFormValidationError.FilterDimensionNotSupportedForMetric,
                  translate,
                );
              }
              return true;
            }
            if (clearedFilterRowIndexRef.current.has(index)) {
              return getAlertFormValidationErrorMsg(
                AlertFormValidationError.FilterDimensionNotSupportedForMetric,
                translate,
              );
            }
            return getAlertFormValidationErrorMsg(AlertFormValidationError.Required, translate);
          },
        };
        const filterValuesRules = {
          validate: (vals: string[]) => {
            if (!metric) return true;
            if (!rowDimension) return true;
            if (Array.isArray(vals) && vals.length > 0) return true;
            return getAlertFormValidationErrorMsg(
              AlertFormValidationError.CategoriesMinOne,
              translate,
            );
          },
        };

        return (
          <div
            key={fieldRow.id}
            className='grid gap-medium medium:[grid-template-columns:minmax(0,1fr)_auto_minmax(0,1fr)_auto] medium:items-start'>
            <div className='min-width-0'>
              <Controller
                name={`filters.${index}.dimension`}
                control={control}
                rules={filterDimensionRules}
                render={({ field, fieldState }) => {
                  const selectable = filterDimensions.filter((d) => {
                    const takenElsewhere = filtersWatch?.some(
                      (row, j) => j !== index && !!row.dimension && row.dimension === d,
                    );
                    return !takenElsewhere || field.value === d;
                  });
                  const dropdownValue =
                    !metric || field.value === '' ? undefined : (field.value as TRAQIV2Dimension);

                  return (
                    <Dropdown
                      key={metric ?? ''}
                      label=''
                      size='Medium'
                      isDisabled={!metric}
                      hasError={!!fieldState.error}
                      hint={fieldState.error?.message}
                      placeholder={translate(
                        translationKey(
                          metric ? 'Label.SelectDimension' : 'Placeholder.SelectMetricFirst',
                          NS,
                        ),
                      )}
                      value={dropdownValue}
                      onOpenChange={(open) => {
                        if (!open) field.onBlur();
                      }}
                      onValueChange={(v) => {
                        clearedFilterDimensionByFieldIdRef.current.delete(fieldId);
                        field.onChange(v as TRAQIV2Dimension);
                        setValue(`filters.${index}.values`, [], { shouldValidate: true });
                      }}>
                      <Menu>
                        {metric
                          ? selectable.map((d) => (
                              <MenuItem
                                key={d}
                                value={d}
                                title={translate(getDimensionRenderer(d).name)}
                              />
                            ))
                          : null}
                      </Menu>
                    </Dropdown>
                  );
                }}
              />
            </div>
            <span className='text-body-medium content-default shrink-0 whitespace-nowrap medium:padding-top-medium'>
              {translate(translationKey('Label.Includes', NS))}
            </span>
            <div className='min-width-0'>
              <Controller
                name={`filters.${index}.values`}
                control={control}
                rules={filterValuesRules}
                render={({ field, fieldState }) => (
                  <ExperienceAlertFilterRowValuesCell
                    hasMetric={metric != null}
                    dimension={rowDimension}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    resource={resource}
                    contextMetrics={contextMetrics}
                    hasError={!!fieldState.error}
                    hint={fieldState.error?.message}
                  />
                )}
              />
            </div>
            <div className='self-start justify-self-start shrink-0 small:justify-self-end'>
              <IconButton
                type='button'
                variant='Utility'
                icon='icon-regular-trash-can'
                ariaLabel={translate(
                  translationKey('Action.Remove', TranslationNamespace.Controls),
                )}
                onClick={() => {
                  clearedFilterDimensionByFieldIdRef.current.delete(fieldRow.id);
                  remove(index);
                }}
              />
            </div>
          </div>
        );
      })}
      <Button
        variant='Standard'
        size='Medium'
        type='button'
        className='self-start'
        icon='icon-filled-plus-small'
        onClick={onAddFilter}>
        {translate(translationKey('Action.AddFilter', NS))}
      </Button>
    </div>
  );
};

export default ExperienceAlertFilterRows;
