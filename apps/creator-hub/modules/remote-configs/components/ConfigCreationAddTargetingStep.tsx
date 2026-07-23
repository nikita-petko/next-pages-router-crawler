import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import {
  Button,
  Dropdown,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  TextInput,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useConfigCreationFormContext from '../context/ConfigCreationFormContext';
import ConfigCreationValueInputField from './ConfigCreationValueInputField';
import ConditionRuleEditor from './ConditionRuleEditor';
import useConfigBooleanValidator from '../hooks/useConfigBooleanValidator';
import useConfigJsonValidator from '../hooks/useConfigJsonValidator';
import useConfigNumberValidator from '../hooks/useConfigNumberValidator';
import useConfigStringValidator from '../hooks/useConfigStringValidator';
import { shouldShowConfigValueError, validateConfigValue } from '../utils/configValueValidation';
import prettyPrintJson from '../utils/prettyPrintJson';
import { createDefaultClause, makeTargetingId } from '../utils/configFormDataTransforms';
import {
  TargetingMode,
  type ConfigFormData,
  type TargetingClauseFormData,
  type TargetingConditionFormData,
} from '../types/FormData';

type ConfigCreationAddTargetingStepProps = {
  onSubmitAddTargeting: (formData: ConfigFormData) => void;
  backButtonLabel: string;
  nextButtonLabel: string;
  isMutationPending: boolean;
  mutationErrorMessage?: string;
  onBack: () => void;
  onCancel: () => void;
};

type ExistingConditionOption = {
  name: string;
};

const createDefaultConditionValue = (): TargetingConditionFormData => {
  return {
    id: makeTargetingId(),
    mode: TargetingMode.ExistingCondition,
    conditionName: '',
    clauses: [createDefaultClause()],
    conditionalStringValue: '',
    conditionalBoolValue: 'true',
  };
};

const ConfigCreationAddTargetingStep: FC<ConfigCreationAddTargetingStepProps> = ({
  onSubmitAddTargeting,
  backButtonLabel,
  nextButtonLabel,
  isMutationPending,
  mutationErrorMessage,
  onBack,
  onCancel,
}) => {
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { allConditionRuleNames } = useConfigCreationFormContext();
  const validateConfigStringValue = useConfigStringValidator();
  const validateConfigJsonValue = useConfigJsonValidator();
  const validateConfigNumberValue = useConfigNumberValidator();
  const validateConfigBooleanValue = useConfigBooleanValidator();

  const [isErrorSnackbarVisible, setIsErrorSnackbarVisible] = useState(false);

  useEffect(() => {
    if (mutationErrorMessage) {
      setIsErrorSnackbarVisible(true);
    }
  }, [mutationErrorMessage]);

  const { control, getValues, handleSubmit, setValue } = useFormContext<ConfigFormData>();
  const overrideType = useWatch({ control, name: 'overrideType' });

  const {
    fields: conditionFields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: 'conditions',
    keyName: 'fieldKey',
  });
  const conditions = useWatch({ control, name: 'conditions' });

  const existingConditionOptions = useMemo<ReadonlyArray<ExistingConditionOption>>(() => {
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

    return Array.from(optionNames)
      .sort((left, right) => left.localeCompare(right))
      .map((name) => ({ name }));
  }, [allConditionRuleNames, conditions]);

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
      remove(conditionValueIndex);
    },
    [remove],
  );
  const hasDuplicateConditionNames = useMemo(() => {
    const trimmedNames = (conditions ?? [])
      .map((condition) => condition.conditionName.trim())
      .filter((conditionName) => !!conditionName);
    return new Set(trimmedNames).size !== trimmedNames.length;
  }, [conditions]);
  const hasInvalidCondition = useMemo(() => {
    return (conditions ?? []).some((condition) => {
      const conditionName = condition.conditionName.trim();
      if (!conditionName) {
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
          condition.clauses.some((clause) => clause.values.length === 0)
        );
      }

      return false;
    });
  }, [
    conditions,
    overrideType,
    validateConfigBooleanValue,
    validateConfigJsonValue,
    validateConfigNumberValue,
    validateConfigStringValue,
  ]);
  const isSecondStepSubmitDisabled = useMemo(() => {
    return isMutationPending || hasInvalidCondition || hasDuplicateConditionNames;
  }, [hasDuplicateConditionNames, hasInvalidCondition, isMutationPending]);

  const createNewConditionLabel = tPendingTranslation(
    'Create a new one',
    'Button label to create a new targeting condition.',
    translationKey(
      'Action.ConfigCreation.AddTargeting.CreateNewCondition',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const useExistingConditionLabel = tPendingTranslation(
    'Use an existing condition',
    'Button label to select an existing targeting condition instead of creating a new one.',
    translationKey(
      'Action.ConfigCreation.AddTargeting.UseExistingCondition',
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
    'ex: New users',
    'Placeholder text in the condition name input field showing an example name.',
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
  const conditionalValuePlaceholder = tPendingTranslation(
    'ex: 50',
    'Placeholder text in the conditional value input field showing an example value.',
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

  return (
    <form className='margin-top-large' onSubmit={handleSubmit(onSubmitAddTargeting)}>
      {conditionFields.map((conditionField, index) => {
        const conditionValue =
          conditions?.[index] ?? (conditionField as TargetingConditionFormData);
        const conditionalValueValidation = validateConfigValue({
          overrideType,
          stringValue: conditionValue.conditionalStringValue,
          boolValue: conditionValue.conditionalBoolValue,
          validateConfigStringValue,
          validateConfigJsonValue,
          validateConfigNumberValue,
          validateConfigBooleanValue,
        });
        const shouldShowConditionalValueError = shouldShowConfigValueError({
          isEditing: false,
          valueValidation: conditionalValueValidation,
        });
        const conditionalValueErrorMessage =
          !conditionalValueValidation.isValid && shouldShowConditionalValueError
            ? conditionalValueValidation.message
            : undefined;
        const showConditionDivider = index < conditionFields.length - 1;
        const hasExistingConditions = existingConditionOptions.length > 0;
        const existingConditionDropdownPlaceholder = hasExistingConditions
          ? existingConditionPlaceholder
          : noExistingConditionLabel;

        return (
          <div
            key={conditionField.fieldKey}
            className={
              showConditionDivider
                ? 'border-b border-stroke-default margin-bottom-medium padding-bottom-medium'
                : 'margin-bottom-medium padding-bottom-medium'
            }>
            {conditionValue.mode === TargetingMode.ExistingCondition ? (
              <div>
                <div className='margin-bottom-xsmall text-body-medium'>{conditionLabel}</div>
                <div className='flex items-end gap-xsmall'>
                  <div className='grow-1 min-width-0'>
                    <Controller
                      name={`conditions.${index}.conditionName` as const}
                      control={control}
                      render={({ field }) => (
                        <Dropdown
                          size='Large'
                          value={field.value || undefined}
                          placeholder={existingConditionDropdownPlaceholder}
                          isDisabled={!hasExistingConditions || isMutationPending}
                          onValueChange={field.onChange}>
                          <Menu>
                            {existingConditionOptions.map((option) => (
                              <MenuItem key={option.name} value={option.name} title={option.name} />
                            ))}
                          </Menu>
                        </Dropdown>
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
                <div className='margin-top-xsmall text-body-small content-muted'>
                  {createNewConditionHint}{' '}
                  <button
                    type='button'
                    disabled={isMutationPending}
                    className='inline bg-none padding-none cursor-pointer underline content-default [border:none]'
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
              </div>
            ) : (
              <div>
                <div className='flex items-end gap-xsmall'>
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
                          isDisabled={isMutationPending}
                        />
                      )}
                    />
                  </div>
                  <div className='padding-bottom-xxsmall'>
                    <IconButton
                      type='button'
                      variant='Standard'
                      icon='icon-regular-trash-can'
                      ariaLabel={deleteLabel}
                      isDisabled={isMutationPending}
                      onClick={() => removeConditionValue(index)}
                    />
                  </div>
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

                <div className='margin-top-xsmall text-body-small content-muted'>
                  <button
                    type='button'
                    disabled={isMutationPending}
                    className='inline bg-none padding-none cursor-pointer underline content-default [border:none]'
                    onClick={() =>
                      updateConditionValue(index, (currentValue) => ({
                        ...currentValue,
                        mode: TargetingMode.ExistingCondition,
                      }))
                    }>
                    {useExistingConditionLabel}
                  </button>
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
                stringPlaceholder={conditionalValuePlaceholder}
                numberPlaceholder={conditionalValuePlaceholder}
                booleanPlaceholder={booleanValuePlaceholder}
                jsonPlaceholder={jsonValuePlaceholder}
              />
            </div>
          </div>
        );
      })}

      <div className='margin-top-small'>
        <Button
          type='button'
          variant='Standard'
          isDisabled={isMutationPending}
          onClick={() => append(createDefaultConditionValue())}>
          {addConditionalValueLabel}
        </Button>
      </div>

      <div className='margin-top-medium flex gap-small'>
        <Button type='button' variant='Standard' isDisabled={isMutationPending} onClick={onBack}>
          {backButtonLabel}
        </Button>
        <Button
          type='submit'
          variant='Emphasis'
          isLoading={isMutationPending}
          isDisabled={isSecondStepSubmitDisabled}>
          {nextButtonLabel}
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

      {isErrorSnackbarVisible && mutationErrorMessage ? (
        <Snackbar
          title={mutationErrorMessage}
          icon='icon-regular-triangle-exclamation'
          shouldAutoDismiss={false}
          onClose={() => setIsErrorSnackbarVisible(false)}
        />
      ) : null}
    </form>
  );
};

export default ConfigCreationAddTargetingStep;
