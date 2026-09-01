import type { FC } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Button, IconButton, Snackbar, TextInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RpnOperator } from '../api/universeConfigsClientEnums';
import useConfigCreationFormContext from '../context/ConfigCreationFormContext';
import useConfigBooleanValidator from '../hooks/useConfigBooleanValidator';
import useConfigConditionNameValidator from '../hooks/useConfigConditionNameValidator';
import useConfigJsonValidator from '../hooks/useConfigJsonValidator';
import useConfigNumberValidator from '../hooks/useConfigNumberValidator';
import useConfigStringValidator from '../hooks/useConfigStringValidator';
import {
  TargetingMode,
  type ConfigFormData,
  type TargetingClauseFormData,
  type TargetingConditionFormData,
} from '../types/FormData';
import {
  createDefaultClause,
  createDefaultConditionValue,
  normalizeClauseJoiners,
} from '../utils/configFormDataTransforms';
import { shouldShowConfigValueError, validateConfigValue } from '../utils/configValueValidation';
import prettyPrintJson from '../utils/prettyPrintJson';
import ConditionPickerDropdown from './ConditionPickerDropdown';
import ConditionRuleEditor from './ConditionRuleEditor';
import ConfigCreationValueInputField from './ConfigCreationValueInputField';

const ADD_TARGETING_FORM_ID = 'config-creation-add-targeting-form';

type ConfigCreationAddTargetingStepProps = {
  onSubmitAddTargeting: (formData: ConfigFormData) => void;
  backButtonLabel: string;
  nextButtonLabel: string;
  // Derived from RHF formState in the parent step container.
  // This captures changes from any previous step, not just this step's fields.
  hasAnyFormChanges: boolean;
  isMutationPending: boolean;
  mutationErrorMessage?: string;
  onBack: () => void;
  onCancel: () => void;
  // When provided, navigation buttons are portaled into this container so the
  // parent can render them in a page-level sticky footer. Submit button is
  // wired to the form via the `form` HTML attribute, so RHF validation still
  // fires correctly even when the button is rendered outside the form.
  actionBarContainer?: HTMLElement | null;
};

type ExistingConditionOption = {
  name: string;
  disabled: boolean;
};

const isEmptyClause = (clause: TargetingClauseFormData): boolean => {
  return !clause.dimension && clause.values.length === 0;
};

const isEmptyConditionValue = (condition: TargetingConditionFormData): boolean => {
  return (
    !condition.conditionName.trim() &&
    !condition.conditionalStringValue.trim() &&
    condition.clauses.every(isEmptyClause)
  );
};

const ConfigCreationAddTargetingStep: FC<ConfigCreationAddTargetingStepProps> = ({
  onSubmitAddTargeting,
  backButtonLabel,
  nextButtonLabel,
  hasAnyFormChanges,
  isMutationPending,
  mutationErrorMessage,
  onBack,
  onCancel,
  actionBarContainer,
}) => {
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { allConditionRuleNames, isEditing } = useConfigCreationFormContext();
  const validateConfigStringValue = useConfigStringValidator();
  const validateConfigJsonValue = useConfigJsonValidator();
  const validateConfigNumberValue = useConfigNumberValidator();
  const validateConfigBooleanValue = useConfigBooleanValidator();
  const validateConfigConditionName = useConfigConditionNameValidator();

  const [dismissedErrorMessage, setDismissedErrorMessage] = useState<string | undefined>();
  const [lastMutationErrorMessage, setLastMutationErrorMessage] = useState<string | undefined>(
    mutationErrorMessage,
  );

  if (mutationErrorMessage !== lastMutationErrorMessage) {
    setLastMutationErrorMessage(mutationErrorMessage);
    if (!mutationErrorMessage) {
      setDismissedErrorMessage(undefined);
    }
  }

  const isErrorSnackbarVisible =
    Boolean(mutationErrorMessage) && mutationErrorMessage !== dismissedErrorMessage;

  const { control, getValues, handleSubmit, setValue } = useFormContext<ConfigFormData>();
  const overrideType = useWatch({ control, name: 'overrideType' });

  const {
    fields: conditionFields,
    append,
    remove,
    update: updateConditionField,
  } = useFieldArray({
    control,
    name: 'conditions',
    keyName: 'fieldKey',
  });
  const conditions = useWatch({ control, name: 'conditions' });

  const existingConditionNames = useMemo<ReadonlyArray<string>>(() => {
    const optionNames = new Set<string>();

    allConditionRuleNames.forEach((name) => optionNames.add(name));

    (conditions ?? []).forEach((condition) => {
      if (condition.mode !== TargetingMode.NewCondition) {
        return;
      }
      const normalizedName = condition.conditionName.trim();
      if (normalizedName) {
        optionNames.add(normalizedName);
      }
    });

    return Array.from(optionNames).sort((left, right) => left.localeCompare(right));
  }, [allConditionRuleNames, conditions]);

  const selectedConditionNames = useMemo(() => {
    return (conditions ?? []).map((condition) => condition.conditionName.trim());
  }, [conditions]);

  const getExistingConditionOptions = useCallback(
    (conditionIndex: number): ReadonlyArray<ExistingConditionOption> => {
      const selectedConditionNamesInOtherRows = new Set<string>();

      selectedConditionNames.forEach((conditionName, index) => {
        if (index !== conditionIndex && conditionName) {
          selectedConditionNamesInOtherRows.add(conditionName);
        }
      });

      return existingConditionNames
        .map((name) => ({
          name,
          disabled: selectedConditionNamesInOtherRows.has(name),
        }))
        .sort((left, right) => {
          if (left.disabled === right.disabled) {
            return left.name.localeCompare(right.name);
          }

          return left.disabled ? 1 : -1;
        });
    },
    [existingConditionNames, selectedConditionNames],
  );

  const updateConditionValue = useCallback(
    (
      conditionValueIndex: number,
      updater: (currentValue: TargetingConditionFormData) => TargetingConditionFormData,
    ) => {
      const fieldName = `conditions.${conditionValueIndex}` as const;
      const currentValue = getValues(fieldName);
      if (!currentValue) {
        return;
      }

      setValue(fieldName, updater(currentValue), {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [getValues, setValue],
  );

  const updateClause = useCallback(
    (
      conditionValueIndex: number,
      clauseId: string,
      updater: (currentClause: TargetingClauseFormData) => TargetingClauseFormData,
    ) => {
      updateConditionValue(conditionValueIndex, (currentValue) => {
        return {
          ...currentValue,
          clauses: currentValue.clauses.map((currentClause) => {
            return currentClause.id === clauseId ? updater(currentClause) : currentClause;
          }),
        };
      });
    },
    [updateConditionValue],
  );

  const removeConditionValue = useCallback(
    (conditionValueIndex: number) => {
      if (conditionFields.length <= 1) {
        updateConditionField(conditionValueIndex, createDefaultConditionValue());
        return;
      }

      remove(conditionValueIndex);
    },
    [conditionFields.length, remove, updateConditionField],
  );
  const hasDuplicateConditionNames = useMemo(() => {
    const trimmedNames = (conditions ?? [])
      .map((condition) => condition.conditionName.trim())
      .filter((conditionName) => !!conditionName);
    return new Set(trimmedNames).size !== trimmedNames.length;
  }, [conditions]);
  const hasInvalidCondition = useMemo(() => {
    return (conditions ?? []).some((condition) => {
      if (isEmptyConditionValue(condition)) {
        return false;
      }

      const conditionName = condition.conditionName.trim();
      if (!conditionName) {
        return true;
      }

      if (
        condition.mode === TargetingMode.NewCondition &&
        !validateConfigConditionName({ value: condition.conditionName }).isValid
      ) {
        return true;
      }

      const conditionalValueValidation = validateConfigValue({
        overrideType,
        stringValue: condition.conditionalStringValue,
        boolValue: condition.conditionalBoolValue,
        validateConfigStringValue,
        validateConfigJsonValue,
        validateConfigNumberValue,
        validateConfigBooleanValue,
      });

      if (!conditionalValueValidation.isValid) {
        return true;
      }

      if (condition.mode === TargetingMode.NewCondition) {
        return (
          condition.clauses.length === 0 ||
          condition.clauses.some((clause) => !clause.dimension || clause.values.length === 0)
        );
      }

      return false;
    });
  }, [
    conditions,
    overrideType,
    validateConfigBooleanValue,
    validateConfigConditionName,
    validateConfigJsonValue,
    validateConfigNumberValue,
    validateConfigStringValue,
  ]);
  const isSecondStepSubmitDisabled = useMemo(() => {
    // Editing flow should not allow staging no-op submissions.
    const isNoOpEdit = isEditing && !hasAnyFormChanges;
    return isMutationPending || hasInvalidCondition || hasDuplicateConditionNames || isNoOpEdit;
  }, [
    hasAnyFormChanges,
    hasDuplicateConditionNames,
    hasInvalidCondition,
    isEditing,
    isMutationPending,
  ]);

  const createNewConditionLabel = tPendingTranslation(
    'Create a new one',
    'Button label to create a new targeting condition.',
    translationKey(
      'Action.ConfigCreation.AddTargeting.CreateNewCondition',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const conditionLabel = tPendingTranslation(
    'Condition',
    'Label for the targeting condition section in config creation.',
    translationKey(
      'Label.ConfigCreation.AddTargeting.Condition',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const conditionNameLabel = tPendingTranslation(
    'Condition name',
    'Input label for naming a new targeting condition.',
    translationKey(
      'Label.ConfigCreation.AddTargeting.ConditionName',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const conditionNamePlaceholder = tPendingTranslation(
    'ex: NewUsers',
    'Placeholder text in the condition name input field showing an example valid condition name.',
    translationKey(
      'Placeholder.ConfigCreation.AddTargeting.ConditionName',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const existingConditionPlaceholder = tPendingTranslation(
    'Select condition',
    'Placeholder text in the dropdown for selecting an existing condition.',
    translationKey(
      'Placeholder.ConfigCreation.AddTargeting.Condition',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const noExistingConditionLabel = tPendingTranslation(
    'No existing conditions yet.',
    'Message shown when there are no existing conditions available to select.',
    translationKey(
      'Message.ConfigCreation.AddTargeting.NoExistingConditions',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const createNewConditionHint = tPendingTranslation(
    "Don't see a condition?",
    'Hint message suggesting the user can create a new condition if they cannot find one.',
    translationKey(
      'Message.ConfigCreation.AddTargeting.CreateNewHint',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const conditionalValueLabel = tPendingTranslation(
    'Conditional value',
    'Label for the input where the user sets the value to use when a condition is met.',
    translationKey(
      'Label.ConfigCreation.AddTargeting.ConditionalValue',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const conditionalStringValuePlaceholder = translate(
    translationKey(
      'Dialog.CreateOrEdit.Placeholder.String.Value',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const conditionalNumberValuePlaceholder = translate(
    translationKey(
      'Placeholder.ConfigCreation.AddTargeting.ConditionalValue',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const booleanValuePlaceholder = translate(
    translationKey(
      'Dialog.CreateOrEdit.Placeholder.Boolean.Value',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const jsonValuePlaceholder = translate(
    translationKey(
      'Dialog.CreateOrEdit.Placeholder.Json.Value',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    {
      jsonString:
        prettyPrintJson(
          JSON.stringify({
            boss_health: 100,
            menu_color: 'red',
            menu_items: ['item1', 'item2', 'item3'],
          }),
        ) ?? '',
    },
  );
  const addConditionalValueLabel = tPendingTranslation(
    'Add conditional value',
    'Button label to add another conditional value entry to the targeting configuration.',
    translationKey(
      'Action.ConfigCreation.AddTargeting.AddConditionalValue',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const deleteLabel = translate(translationKey('Action.Delete', TranslationNamespace.Controls));

  const actionBar = (
    <div className='flex gap-small'>
      <Button
        type='submit'
        form={ADD_TARGETING_FORM_ID}
        variant='Emphasis'
        isLoading={isMutationPending}
        isDisabled={isSecondStepSubmitDisabled}>
        {nextButtonLabel}
      </Button>
      <Button type='button' variant='Standard' isDisabled={isMutationPending} onClick={onBack}>
        {backButtonLabel}
      </Button>
      <Button type='button' variant='Standard' isDisabled={isMutationPending} onClick={onCancel}>
        {translate(
          translationKey(
            'Dialog.CreateOrEdit.Button.Cancel',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}
      </Button>
    </div>
  );

  const renderedActionBar = actionBarContainer
    ? createPortal(actionBar, actionBarContainer)
    : actionBar;

  const handleAddTargetingSubmit = useCallback(
    (formData: ConfigFormData) => {
      onSubmitAddTargeting({
        ...formData,
        conditions: formData.conditions
          .filter((condition) => !isEmptyConditionValue(condition))
          .map((condition) =>
            condition.mode === TargetingMode.NewCondition
              ? {
                  ...condition,
                  clauses: normalizeClauseJoiners(condition.clauses, RpnOperator.And),
                }
              : condition,
          ),
      });
    },
    [onSubmitAddTargeting],
  );

  return (
    <form
      id={ADD_TARGETING_FORM_ID}
      className='margin-top-large'
      onSubmit={handleSubmit(handleAddTargetingSubmit)}>
      {conditionFields.map((conditionField, index) => {
        const conditionValue =
          conditions?.[index] ?? (conditionField as TargetingConditionFormData);
        const isEmptyCondition = isEmptyConditionValue(conditionValue);
        const conditionalValueValidation = validateConfigValue({
          overrideType,
          stringValue: conditionValue.conditionalStringValue,
          boolValue: conditionValue.conditionalBoolValue,
          validateConfigStringValue,
          validateConfigJsonValue,
          validateConfigNumberValue,
          validateConfigBooleanValue,
        });
        const shouldShowConditionalValueError =
          shouldShowConfigValueError({
            isEditing: false,
            valueValidation: conditionalValueValidation,
          }) && !isEmptyCondition;
        const conditionalValueErrorMessage =
          !conditionalValueValidation.isValid && shouldShowConditionalValueError
            ? conditionalValueValidation.message
            : undefined;
        const showConditionDivider = index < conditionFields.length - 1;
        const existingConditionOptions = getExistingConditionOptions(index);
        const hasExistingConditions = existingConditionOptions.length > 0;
        const existingConditionDropdownPlaceholder = hasExistingConditions
          ? existingConditionPlaceholder
          : noExistingConditionLabel;
        const conditionNameValidation = validateConfigConditionName({
          value: conditionValue.conditionName,
        });
        const shouldShowConditionNameError =
          conditionValue.conditionName.length > 0 && !conditionNameValidation.isValid;
        const conditionNameErrorMessage = shouldShowConditionNameError
          ? conditionNameValidation.message
          : undefined;
        const hasSelectedExistingCondition = conditionValue.conditionName.trim().length > 0;

        return (
          <div
            key={conditionField.fieldKey}
            className={
              showConditionDivider
                ? '[border-bottom:1px_solid_var(--color-stroke-default)] margin-bottom-medium padding-bottom-medium'
                : 'margin-bottom-medium padding-bottom-medium'
            }>
            {conditionValue.mode === TargetingMode.ExistingCondition ? (
              <div>
                <div className='flex items-end gap-medium'>
                  <div className='grow-1 min-width-0'>
                    <Controller
                      name={`conditions.${index}.conditionName` as const}
                      control={control}
                      render={({ field }) => (
                        <ConditionPickerDropdown
                          conditionOptions={existingConditionOptions}
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                          isDisabled={!hasExistingConditions || isMutationPending}
                          label={conditionLabel}
                          placeholder={existingConditionDropdownPlaceholder}
                        />
                      )}
                    />
                  </div>
                  <IconButton
                    type='button'
                    variant='Standard'
                    icon='icon-regular-trash-can'
                    ariaLabel={deleteLabel}
                    isDisabled={isMutationPending}
                    onClick={() => removeConditionValue(index)}
                  />
                </div>
                {!hasSelectedExistingCondition ? (
                  <div className='margin-top-[var(--size-150)] text-body-small content-muted'>
                    {createNewConditionHint}{' '}
                    <button
                      type='button'
                      disabled={isMutationPending}
                      className='text-body-small underline cursor-pointer padding-none bg-none [border:none] [font-family:inherit] [color:inherit]'
                      onClick={() =>
                        updateConditionValue(index, (currentValue) => ({
                          ...currentValue,
                          mode: TargetingMode.NewCondition,
                          clauses:
                            currentValue.clauses.length > 0
                              ? currentValue.clauses
                              : [createDefaultClause()],
                        }))
                      }>
                      {createNewConditionLabel}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div>
                <div className='flex items-start gap-medium'>
                  <div className='grow-1 min-width-0'>
                    <Controller
                      name={`conditions.${index}.conditionName` as const}
                      control={control}
                      render={({ field }) => (
                        <TextInput
                          {...field}
                          id={`condition-name-${conditionValue.id}`}
                          size='Large'
                          label={conditionNameLabel}
                          placeholder={conditionNamePlaceholder}
                          hasError={shouldShowConditionNameError}
                          error={conditionNameErrorMessage}
                          isDisabled={isMutationPending}
                        />
                      )}
                    />
                  </div>
                  <IconButton
                    type='button'
                    variant='Standard'
                    icon='icon-regular-trash-can'
                    ariaLabel={deleteLabel}
                    className='margin-top-[30px] shrink-0'
                    isDisabled={isMutationPending}
                    onClick={() => removeConditionValue(index)}
                  />
                </div>

                <div className='margin-top-small'>
                  <ConditionRuleEditor
                    clauses={conditionValue.clauses}
                    onUpdateClause={(clauseId, updater) => updateClause(index, clauseId, updater)}
                    onRemoveClause={(clauseId) =>
                      updateConditionValue(index, (currentValue) => ({
                        ...currentValue,
                        clauses: currentValue.clauses.filter((c) => c.id !== clauseId),
                      }))
                    }
                    onAddClause={() =>
                      updateConditionValue(index, (currentValue) => ({
                        ...currentValue,
                        clauses: [...currentValue.clauses, createDefaultClause()],
                      }))
                    }
                    isDisabled={isMutationPending}
                  />
                </div>
              </div>
            )}

            <div className='margin-top-small'>
              <ConfigCreationValueInputField
                control={control}
                overrideType={overrideType}
                stringValueName={`conditions.${index}.conditionalStringValue` as const}
                boolValueName={`conditions.${index}.conditionalBoolValue` as const}
                id={`condition-value-${conditionValue.id}`}
                label={conditionalValueLabel}
                isDisabled={isMutationPending}
                hasError={shouldShowConditionalValueError}
                error={conditionalValueErrorMessage}
                stringPlaceholder={conditionalStringValuePlaceholder}
                numberPlaceholder={conditionalNumberValuePlaceholder}
                booleanPlaceholder={booleanValuePlaceholder}
                jsonPlaceholder={jsonValuePlaceholder}
              />
            </div>
          </div>
        );
      })}

      <div className='margin-y-medium'>
        <Button
          type='button'
          variant='Standard'
          size='Small'
          isDisabled={isMutationPending}
          onClick={() => append(createDefaultConditionValue())}>
          {addConditionalValueLabel}
        </Button>
      </div>

      {renderedActionBar}

      {isErrorSnackbarVisible && mutationErrorMessage ? (
        <Snackbar
          title={mutationErrorMessage}
          icon='icon-regular-triangle-exclamation'
          shouldAutoDismiss={false}
          onClose={() => setDismissedErrorMessage(mutationErrorMessage)}
        />
      ) : null}
    </form>
  );
};

export default ConfigCreationAddTargetingStep;
