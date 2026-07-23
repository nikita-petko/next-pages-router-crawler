import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Controller, useFormContext, useWatch, type UseFormSetValue } from 'react-hook-form';
import {
  RAQIV2Dimension,
  type TRAQIV2APIMetric,
  type TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import { Dropdown, Menu, MenuItem } from '@rbx/foundation-ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { FoundationLikeMultiSelect } from '@modules/charts-generic/components/FoundationLikeMultiSelect/FoundationLikeMultiSelect';
import {
  Menu as MultiSelectMenu,
  MenuItem as MultiSelectMenuItem,
} from '@modules/charts-generic/components/FoundationLikeMultiSelect/FoundationLikeMultiSelectMenu';
import type { RAQIV2ChartResource } from '@modules/clients/analytics';
import getDimensionRenderer from '@modules/experience-analytics-shared/components/getDimensionRenderer';
import useRAQIV2DimensionChoiceRenderBundle from '@modules/experience-analytics-shared/hooks/useRAQIV2DimensionChoiceRenderBundle';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { ALERT_FORM_NONE_DIMENSION } from '../../constants/alertFormConstants';
import type { ExperienceAlertFormValues } from '../../constants/types';
import {
  AlertFormValidationError,
  getAlertFormValidationErrorMsg,
} from '../../constants/validationErrorMessages';
import {
  getAlertBreakdownDimensionsForMetric,
  uiAlertMetricToApiMetrics,
} from '../../utils/analyticsAlertFormUtils';

type BreakdownCategoriesSelectProps = {
  label: FormattedText;
  resource: RAQIV2ChartResource;
  dimension: TRAQIV2Dimension;
  contextMetrics: TRAQIV2APIMetric[];
  value: string[];
  onChange: (next: string[]) => void;
  setValue: UseFormSetValue<ExperienceAlertFormValues>;
  hasError?: boolean;
  hint?: string;
  onOpenChange?: (open: boolean) => void;
};

const BreakdownCategoriesSelect: FC<BreakdownCategoriesSelectProps> = ({
  label,
  resource,
  dimension,
  contextMetrics,
  value,
  onChange,
  setValue,
  hasError,
  hint,
  onOpenChange,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { enumOptions, isDataLoading, formatOption } = useRAQIV2DimensionChoiceRenderBundle(
    resource,
    dimension,
    contextMetrics,
  );

  const enumOptionsKey = useMemo(() => [...enumOptions].sort().join('\0'), [enumOptions]);

  const didInitialFillRef = useRef(false);
  useEffect(() => {
    if (enumOptions.length === 0) {
      return;
    }

    if (!didInitialFillRef.current) {
      didInitialFillRef.current = true;
      // Only auto-select all options when the form has no preset categories. This preserves
      // defaults provided by the configure (edit) flow, which hydrates `breakdownCategories`
      // from the existing alert configuration via `analyticsAlertDetailToFormValues`.
      if (value.length === 0) {
        setValue('breakdownCategories', [...enumOptions], { shouldValidate: true });
      }
      return;
    }

    const next = value.filter((v) => enumOptions.includes(v));
    const unchanged = next.length === value.length && next.every((v, i) => v === value[i]);
    if (!unchanged) {
      onChange(next);
    }
  }, [enumOptionsKey, onChange, setValue, value, enumOptions]);

  const formatValue = useCallback(
    (selectedValues: string[]) => {
      if (selectedValues.length === 0) {
        return '';
      }
      return selectedValues.map((v) => formatOption(v)).join(', ');
    },
    [formatOption],
  );

  const isDisabled = isDataLoading || enumOptions.length === 0;

  return (
    <FoundationLikeMultiSelect
      label={label}
      size='Medium'
      placeholder={translate(
        translationKey('Placeholder.SelectCategories', TranslationNamespace.ExperienceAlerts),
      )}
      value={value}
      onValueChange={onChange}
      onOpenChange={onOpenChange}
      isDisabled={isDisabled}
      hasError={hasError}
      hint={hint}
      formatValue={formatValue}>
      <MultiSelectMenu>
        {enumOptions.map((opt) => (
          <MultiSelectMenuItem key={opt} value={opt} title={formatOption(opt)} />
        ))}
      </MultiSelectMenu>
    </FoundationLikeMultiSelect>
  );
};

export type ExperienceAlertBreakdownFieldsProps = {
  metric: ExperienceAlertFormValues['metric'];
  resource: RAQIV2ChartResource;
};

const ExperienceAlertBreakdownFields: FC<ExperienceAlertBreakdownFieldsProps> = ({
  metric,
  resource,
}) => {
  const { control, setValue } = useFormContext<ExperienceAlertFormValues>();
  const breakdownDimension = useWatch({ control, name: 'breakdownDimension' });
  const contextMetrics = useMemo(() => (metric ? uiAlertMetricToApiMetrics(metric) : []), [metric]);
  const breakdownDimensions = useMemo(
    () => (metric ? getAlertBreakdownDimensionsForMetric(metric) : []),
    [metric],
  );

  const { translate } = useRAQIV2TranslationDependencies();
  const breakdownCategoriesLabel = translate(
    translationKey('Label.BreakdownCategories', TranslationNamespace.ExperienceAlerts),
  );

  const showBreakdownCategories = metric != null && breakdownDimension != null;

  const breakdownCategoriesRules = useMemo(
    () => ({
      validate: (categories: string[]) => {
        if (breakdownDimension == null) {
          return true;
        }
        if (Array.isArray(categories) && categories.length > 0) {
          return true;
        }
        return getAlertFormValidationErrorMsg(AlertFormValidationError.CategoriesMinOne, translate);
      },
    }),
    [breakdownDimension, translate],
  );

  return (
    <div
      className={
        showBreakdownCategories ? 'flex flex-row no-wrap gap-medium width-full' : 'width-full'
      }>
      <div
        className={`flex flex-col width-full ${showBreakdownCategories ? 'grow-1 basis-0 width-full' : ''}`}>
        <Controller
          name='breakdownDimension'
          control={control}
          render={({ field }) => {
            const dropdownValue = !metric ? undefined : (field.value ?? ALERT_FORM_NONE_DIMENSION);

            return (
              <Dropdown
                key={metric ?? ''}
                label={translate(translationKey('Label.Breakdown', TranslationNamespace.Analytics))}
                labelTooltip={{
                  title: translate(
                    translationKey('Label.Breakdown', TranslationNamespace.Analytics),
                  ),
                  description: translate(
                    translationKey('Tooltip.Breakdown', TranslationNamespace.ExperienceAlerts),
                  ),
                }}
                hint={
                  metric && field.value != null
                    ? translate(
                        translationKey(
                          'Message.BreakdownCategories',
                          TranslationNamespace.ExperienceAlerts,
                        ),
                      )
                    : undefined
                }
                size='Medium'
                isDisabled={!metric}
                placeholder={translate(
                  translationKey(
                    metric ? 'Label.SelectDimension' : 'Placeholder.SelectMetricFirst',
                    TranslationNamespace.ExperienceAlerts,
                  ),
                )}
                value={dropdownValue}
                onValueChange={(v) => {
                  const next: TRAQIV2Dimension | null =
                    v === ALERT_FORM_NONE_DIMENSION || !isValidEnumValue(RAQIV2Dimension, v)
                      ? null
                      : v;
                  field.onChange(next);
                  setValue('breakdownCategories', []);
                }}>
                <Menu>
                  {metric ? (
                    <>
                      <MenuItem
                        value={ALERT_FORM_NONE_DIMENSION}
                        title={translate(
                          translationKey('Label.None', TranslationNamespace.Analytics),
                        )}
                      />
                      {breakdownDimensions.map((d) => (
                        <MenuItem
                          key={d}
                          value={d}
                          title={translate(getDimensionRenderer(d).name)}
                        />
                      ))}
                    </>
                  ) : null}
                </Menu>
              </Dropdown>
            );
          }}
        />
      </div>
      {showBreakdownCategories ? (
        <div className='flex flex-col gap-small grow-1 basis-0 width-full'>
          <Controller
            key={breakdownDimension}
            name='breakdownCategories'
            control={control}
            rules={breakdownCategoriesRules}
            render={({ field, fieldState }) => (
              <BreakdownCategoriesSelect
                label={breakdownCategoriesLabel}
                resource={resource}
                dimension={breakdownDimension}
                contextMetrics={contextMetrics}
                value={field.value}
                onChange={field.onChange}
                setValue={setValue}
                hasError={!!fieldState.error}
                hint={fieldState.error?.message}
                onOpenChange={(open) => {
                  if (!open) {
                    field.onBlur();
                  }
                }}
              />
            )}
          />
        </div>
      ) : null}
    </div>
  );
};

export default ExperienceAlertBreakdownFields;
