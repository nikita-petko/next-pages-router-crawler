import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import {
  Button,
  Dropdown,
  Menu,
  MenuItem,
  SheetActions,
  SheetBody,
  SheetContent,
  SheetRoot,
  SheetTitle,
  TextInput,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import RAQIV2ClientProvider from '@modules/experience-analytics-shared/context/RAQIV2ClientProvider';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type { CustomMetric } from '../types/CustomMetric';
import { CustomMetricCategory, MAX_CUSTOM_METRIC_NAME_LENGTH } from '../types/CustomMetric';
import { CustomMetricCalculation } from '../types/CustomMetricCalculation';
import {
  buildAutoMetricName,
  CONTEXT_METRICS_BY_CATEGORY,
  isDraftValid,
  makeEmptyDraft,
  metricToDraft,
  PRIMARY_SELECTIONS_BY_CATEGORY,
} from '../utils/customMetricDraft';
import type { CustomMetricDraft } from '../utils/customMetricDraft';
import {
  CALCULATIONS_BY_CATEGORY,
  CUSTOM_METRIC_CATEGORY_ORDER,
  FILTER_DIMENSIONS_BY_CATEGORY,
} from '../utils/customMetricOptions';
import CustomMetricDimensionValueSelect from './CustomMetricDimensionValueSelect';
import CustomMetricFilterRows from './CustomMetricFilterRows';
import useCustomMetricDrawerLabels from './useCustomMetricDrawerLabels';

const CONTROLS_NS = TranslationNamespace.Controls;

export type CustomMetricDrawerProps = {
  open: boolean;
  mode: 'add' | 'edit';
  // The metric being edited; ignored for the 'add' mode.
  initialMetric?: CustomMetric;
  onClose: () => void;
  onSave: (draft: CustomMetricDraft) => void;
  disabled?: boolean;
};

type CustomMetricDrawerContentProps = Omit<CustomMetricDrawerProps, 'open'>;

/**
 * Body of the custom-metric drawer. Split out from {@link CustomMetricDrawer} so
 * the form/resource hooks only run while the sheet is open (its content is
 * unmounted when closed), which also means each open starts from a fresh form.
 * Runs its own nested react-hook-form over a {@link CustomMetricDraft} so
 * in-progress edits (and the transient superset of category fields) never touch
 * the parent experiment form; the validated draft is handed back via `onSave`
 * only when the creator hits Save. Copy lives in {@link useCustomMetricDrawerLabels}.
 */
const CustomMetricDrawerContent: FC<CustomMetricDrawerContentProps> = ({
  mode,
  initialMetric,
  onClose,
  onSave,
  disabled = false,
}) => {
  const labels = useCustomMetricDrawerLabels();
  const resource = useUniverseResource();

  const initialDraft = useMemo<CustomMetricDraft>(
    () => (mode === 'edit' && initialMetric ? metricToDraft(initialMetric) : makeEmptyDraft()),
    [mode, initialMetric],
  );

  const methods = useForm<CustomMetricDraft>({ defaultValues: initialDraft });
  const { control, setValue, getValues, reset, watch } = methods;

  // Whether the creator has hand-edited the name. Until then the name tracks the
  // auto-generated suggestion. An existing metric's name (edit mode) is treated
  // as already user-owned so we never clobber it.
  const nameManuallyEditedRef = useRef(mode === 'edit');

  const draft = watch();
  const category = draft.category;

  // Keep the name in sync with the selections until the creator edits it. Driven
  // by a form-change subscription (an event, not render-derived state) so the
  // name is recomputed only when a field actually changes.
  useEffect(() => {
    const subscription = watch((_values, { name: changedField }) => {
      // Skip our own writes / the creator's manual edits to the name field.
      if (changedField === 'name' || nameManuallyEditedRef.current) {
        return;
      }
      const nextName = buildAutoMetricName(getValues());
      if (getValues('name') !== nextName) {
        setValue('name', nextName);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues, setValue]);

  const handleCategoryChange = useCallback(
    (next: string) => {
      if (!isValidEnumValue(CustomMetricCategory, next)) {
        return;
      }
      setValue('category', next);
      // Primary selections are category-specific — clear them all on switch.
      setValue('currency', null);
      setValue('funnel', null);
      setValue('funnelStep', null);
      setValue('customEvent', null);
      // Drop filters whose dimension isn't valid for the new category.
      const validDimensions = new Set<string>(FILTER_DIMENSIONS_BY_CATEGORY[next]);
      const keptFilters = getValues('filters').filter((filter) =>
        validDimensions.has(filter.dimension),
      );
      setValue('filters', keptFilters);
    },
    [setValue, getValues],
  );

  const canSave = !disabled && isDraftValid(draft);

  const handleSave = useCallback(() => {
    const values = getValues();
    if (!isDraftValid(values)) {
      return;
    }
    onSave(values);
    onClose();
  }, [getValues, onSave, onClose]);

  const handleResetAll = useCallback(() => {
    reset(initialDraft);
    nameManuallyEditedRef.current = mode === 'edit';
  }, [reset, initialDraft, mode]);

  return (
    <RAQIV2ClientProvider>
      <FormProvider {...methods}>
        <SheetTitle className='text-heading-medium'>
          {mode === 'edit' ? labels.editTitle : labels.addTitle}
        </SheetTitle>
        <SheetBody>
          <div className='flex flex-col gap-large'>
            <span className='text-label-large content-emphasis'>{labels.definition}</span>

            {/* Source (category) */}
            <div className='flex flex-col gap-xxsmall'>
              <span className='text-label-medium content-emphasis'>{labels.sourceLabel}</span>
              <Dropdown
                size='Medium'
                value={category}
                isDisabled={disabled}
                placeholder={labels.sourcePlaceholder}
                onValueChange={handleCategoryChange}>
                <Menu>
                  {CUSTOM_METRIC_CATEGORY_ORDER.map((option) => (
                    <MenuItem key={option} value={option} title={labels.categoryLabel[option]} />
                  ))}
                </Menu>
              </Dropdown>
            </div>

            {/* Primary selection(s): one dimension-value dropdown per entry — a
                category can expose more than one (funnel = funnel + funnel step).
                Values fetch from the gateway; a scoped selection (funnel step)
                stays disabled until the selection it depends on is chosen. */}
            {PRIMARY_SELECTIONS_BY_CATEGORY[category].map((selection) => {
              const scopeValue = selection.scopedBy ? draft[selection.scopedBy.field] : null;
              const scopingFilter =
                selection.scopedBy && scopeValue
                  ? [{ dimension: selection.scopedBy.dimension, values: [scopeValue] }]
                  : undefined;
              const awaitingScope = selection.scopedBy != null && !scopeValue;
              return (
                <div key={selection.field} className='flex flex-col gap-xxsmall'>
                  <span className='text-label-medium content-emphasis'>
                    {labels.primaryLabel[selection.field]}
                  </span>
                  <Controller
                    name={selection.field}
                    control={control}
                    render={({ field }) => (
                      <CustomMetricDimensionValueSelect
                        resource={resource}
                        dimension={selection.dimension}
                        contextMetrics={CONTEXT_METRICS_BY_CATEGORY[category]}
                        scopingFilter={scopingFilter}
                        multiple={false}
                        value={field.value ? [field.value] : []}
                        onChange={(nextValues) => field.onChange(nextValues[0] ?? null)}
                        onBlur={field.onBlur}
                        placeholder={labels.primaryPlaceholder[selection.field]}
                        isDisabled={disabled || awaitingScope}
                      />
                    )}
                  />
                </div>
              );
            })}

            {/* Calculation */}
            <div className='flex flex-col gap-xxsmall'>
              <span className='text-label-medium content-emphasis'>{labels.calculationLabel}</span>
              <Controller
                name='calculation'
                control={control}
                render={({ field }) => (
                  <Dropdown
                    size='Medium'
                    value={field.value ?? undefined}
                    isDisabled={disabled}
                    placeholder={labels.calculationPlaceholder}
                    onValueChange={(next) => {
                      if (isValidEnumValue(CustomMetricCalculation, next)) {
                        field.onChange(next);
                      }
                    }}>
                    <Menu>
                      {CALCULATIONS_BY_CATEGORY[category].map((calculation) => (
                        <MenuItem
                          key={calculation}
                          value={calculation}
                          title={labels.calculationOption[calculation]}
                        />
                      ))}
                    </Menu>
                  </Dropdown>
                )}
              />
            </div>

            <CustomMetricFilterRows category={category} resource={resource} disabled={disabled} />

            {/* Metric name */}
            <Controller
              name='name'
              control={control}
              render={({ field }) => (
                <TextInput
                  label={labels.nameLabel}
                  placeholder={labels.namePlaceholder}
                  helperText={labels.nameHint}
                  maxLength={MAX_CUSTOM_METRIC_NAME_LENGTH}
                  isDisabled={disabled}
                  value={field.value}
                  onChange={(event) => {
                    nameManuallyEditedRef.current = true;
                    field.onChange(event.currentTarget.value);
                  }}
                />
              )}
            />
          </div>
        </SheetBody>

        <SheetActions>
          <div className='flex flex-row items-center justify-between gap-medium width-full'>
            <div className='flex flex-row items-center gap-medium'>
              <Button
                type='button'
                variant='Emphasis'
                size='Medium'
                isDisabled={!canSave}
                onClick={handleSave}>
                {labels.save}
              </Button>
              <Button type='button' variant='Standard' size='Medium' onClick={onClose}>
                {labels.cancel}
              </Button>
            </div>
            <Button
              type='button'
              variant='Utility'
              size='Medium'
              isDisabled={disabled}
              onClick={handleResetAll}>
              {labels.resetAll}
            </Button>
          </div>
        </SheetActions>
      </FormProvider>
    </RAQIV2ClientProvider>
  );
};

/**
 * Right-side "Add / Edit custom metric" panel. Source / Event type / Calculation
 * / Filters / Metric name mirror the design; the value dropdowns fetch their
 * options from the analytics query gateway (same as the analytics filter
 * drawer). The panel content is only mounted while open — see
 * {@link CustomMetricDrawerContent}.
 */
const CustomMetricDrawer: FC<CustomMetricDrawerProps> = ({ open, onClose, ...contentProps }) => {
  const { translate } = useTranslationWrapper(useTranslation());

  return (
    <SheetRoot
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}>
      {/* Only mount the content while open so a closed drawer does no work
          (the Sheet's responsive layout + the gateway/resource hooks in the
          content otherwise run for every closed instance). */}
      {open && (
        <SheetContent
          largeScreenVariant='side'
          closeLabel={translate(translationKey('Action.Close', CONTROLS_NS))}>
          <CustomMetricDrawerContent onClose={onClose} {...contentProps} />
        </SheetContent>
      )}
    </SheetRoot>
  );
};

export default CustomMetricDrawer;
