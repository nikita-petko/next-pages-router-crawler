import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { RAQIV2Dimension, RAQIV2DimensionDisplayConfig } from '@rbx/creator-hub-analytics-config';
import { Button, Dropdown, Menu, MenuItem } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { RAQIV2ChartResource } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type { CustomMetricCategory } from '../types/CustomMetric';
import { CONTEXT_METRICS_BY_CATEGORY } from '../utils/customMetricDraft';
import type { CustomMetricDraft } from '../utils/customMetricDraft';
import { FILTER_DIMENSIONS_BY_CATEGORY } from '../utils/customMetricOptions';
import CustomMetricDimensionValueSelect from './CustomMetricDimensionValueSelect';

type CustomMetricFilterRowsProps = {
  category: CustomMetricCategory;
  resource: RAQIV2ChartResource;
  disabled?: boolean;
};

/**
 * "Filters" section of the custom-metric drawer: an optional, repeatable list of
 * `{ dimension, values }` rows that narrow what the metric tracks. Each row is a
 * dimension dropdown (scoped to the category's allow-list and de-duplicated
 * against the other rows) plus a gateway-backed value multi-select. Driven by
 * the drawer's nested `CustomMetricDraft` form via `useFieldArray`.
 */
const CustomMetricFilterRows: FC<CustomMetricFilterRowsProps> = ({
  category,
  resource,
  disabled = false,
}) => {
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { control, setValue } = useFormContext<CustomMetricDraft>();
  const { fields, append, remove } = useFieldArray({ control, name: 'filters' });
  const filtersWatch = useWatch({ control, name: 'filters' });

  const contextMetrics = useMemo(() => CONTEXT_METRICS_BY_CATEGORY[category], [category]);
  const availableDimensions = useMemo(() => FILTER_DIMENSIONS_BY_CATEGORY[category], [category]);

  // The first category dimension not already taken by an existing row — used to
  // seed a new row (so every filter always carries a concrete dimension).
  const nextUnusedDimension = useMemo<RAQIV2Dimension | undefined>(() => {
    const used = new Set((filtersWatch ?? []).map((filter) => filter.dimension));
    return availableDimensions.find((dimension) => !used.has(dimension));
  }, [availableDimensions, filtersWatch]);

  const dimensionLabel = (dimension: RAQIV2Dimension): string =>
    translate(RAQIV2DimensionDisplayConfig[dimension].name);

  const onAddFilter = useCallback(() => {
    if (!nextUnusedDimension) {
      return;
    }
    append({ dimension: nextUnusedDimension, values: [] });
  }, [append, nextUnusedDimension]);

  const canAddFilter = !disabled && nextUnusedDimension !== undefined;

  const valuesPlaceholder = tPendingTranslation(
    'Select values',
    'Placeholder for the value multi-select on a custom metric filter row.',
    translationKey(
      'Placeholder.ExperimentCreation.CustomMetricFilterValues',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  return (
    <div className='flex flex-col gap-medium'>
      <div className='flex flex-col gap-xxsmall'>
        <span className='text-label-medium content-emphasis'>
          {tPendingTranslation(
            'Filters',
            'Heading for the optional filters section of the custom metric drawer.',
            translationKey(
              'Label.ExperimentCreation.CustomMetricFilters',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </span>
        <span className='text-body-medium content-muted'>
          {tPendingTranslation(
            'Further specify what this metric will track. This is optional.',
            'Description under the Filters heading in the custom metric drawer.',
            translationKey(
              'Message.ExperimentCreation.CustomMetricFiltersDescription',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </span>
      </div>

      {fields.map((fieldRow, index) => {
        const rowDimension = filtersWatch?.[index]?.dimension;
        return (
          <div key={fieldRow.id} className='flex flex-col gap-small'>
            <span className='text-label-medium content-emphasis'>
              {tPendingTranslation(
                'Filter {number}',
                'Label for a single filter row in the custom metric drawer (numbered).',
                translationKey(
                  'Label.ExperimentCreation.CustomMetricFilterNumber',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
                { number: String(index + 1) },
              )}
            </span>
            <Controller
              name={`filters.${index}.dimension`}
              control={control}
              render={({ field }) => {
                const selectable = availableDimensions.filter((dimension) => {
                  const takenElsewhere = filtersWatch?.some(
                    (row, otherIndex) => otherIndex !== index && row.dimension === dimension,
                  );
                  return !takenElsewhere || field.value === dimension;
                });
                return (
                  <Dropdown
                    size='Medium'
                    isDisabled={disabled}
                    value={field.value}
                    placeholder={tPendingTranslation(
                      'Select dimension',
                      'Placeholder for the dimension dropdown on a custom metric filter row.',
                      translationKey(
                        'Placeholder.ExperimentCreation.CustomMetricFilterDimension',
                        TranslationNamespace.UniverseConfigAndExperimentation,
                      ),
                    )}
                    onValueChange={(next) => {
                      if (!isValidEnumValue(RAQIV2Dimension, next)) {
                        return;
                      }
                      field.onChange(next);
                      // A new dimension invalidates the previously selected
                      // values, so clear them.
                      setValue(`filters.${index}.values`, []);
                    }}>
                    <Menu>
                      {selectable.map((dimension) => (
                        <MenuItem
                          key={dimension}
                          value={dimension}
                          title={dimensionLabel(dimension)}
                        />
                      ))}
                    </Menu>
                  </Dropdown>
                );
              }}
            />
            {rowDimension && (
              <Controller
                name={`filters.${index}.values`}
                control={control}
                render={({ field }) => (
                  <CustomMetricDimensionValueSelect
                    resource={resource}
                    dimension={rowDimension}
                    contextMetrics={contextMetrics}
                    multiple
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder={valuesPlaceholder}
                    isDisabled={disabled}
                  />
                )}
              />
            )}
            <div className='flex justify-end'>
              <Button
                type='button'
                variant='Utility'
                size='Small'
                isDisabled={disabled}
                onClick={() => remove(index)}>
                {tPendingTranslation(
                  'Delete',
                  'Button to remove a filter row in the custom metric drawer.',
                  translationKey(
                    'Action.ExperimentCreation.DeleteCustomMetricFilter',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                )}
              </Button>
            </div>
          </div>
        );
      })}

      <Button
        type='button'
        variant='Standard'
        size='Medium'
        className='self-start'
        icon='icon-filled-plus-small'
        isDisabled={!canAddFilter}
        onClick={onAddFilter}>
        {tPendingTranslation(
          'Filter',
          'Button label to add another filter row in the custom metric drawer.',
          translationKey(
            'Action.ExperimentCreation.AddCustomMetricFilter',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}
      </Button>
    </div>
  );
};

export default CustomMetricFilterRows;
