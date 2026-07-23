import { FC, useMemo } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Button, Dropdown, Menu, MenuItem, TextArea, TextInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ValidConfigEntryValueType } from '../api/universeConfigsClientEnums';
import ConfigCreationValueInputField from './ConfigCreationValueInputField';
import useConfigBooleanValidator from '../hooks/useConfigBooleanValidator';
import useConfigJsonValidator from '../hooks/useConfigJsonValidator';
import useConfigKeyValidator from '../hooks/useConfigKeyValidator';
import useConfigNumberValidator from '../hooks/useConfigNumberValidator';
import useConfigStringValidator from '../hooks/useConfigStringValidator';
import { ValidationError } from '../hooks/validatorTypes';
import prettyPrintJson from '../utils/prettyPrintJson';
import { shouldShowConfigValueError, validateConfigValue } from '../utils/configValueValidation';
import type { ConfigFormData } from '../types/FormData';
import useConfigCreationFormContext from '../context/ConfigCreationFormContext';

type TypeOption = {
  value: ValidConfigEntryValueType;
  label: string;
};

type ConfigCreationDefineKeyStepProps = {
  isStepTransitionPending: boolean;
  nextButtonLabel: string;
  onNext: () => void;
  onCancel: () => void;
};

const ConfigCreationDefineKeyStep: FC<ConfigCreationDefineKeyStepProps> = ({
  isStepTransitionPending,
  nextButtonLabel,
  onNext,
  onCancel,
}) => {
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { isEditing } = useConfigCreationFormContext();
  const { control } = useFormContext<ConfigFormData>();

  const configKey = useWatch({ control, name: 'configKey' });
  const overrideType = useWatch({ control, name: 'overrideType' });
  const stringValue = useWatch({ control, name: 'stringValue' });
  const boolValue = useWatch({ control, name: 'boolValue' });

  const typeOptions = useMemo<ReadonlyArray<TypeOption>>(() => {
    return [
      {
        value: ValidConfigEntryValueType.String,
        label: tPendingTranslation(
          'String',
          'Option label for the string data type when defining a configuration key.',
          translationKey(
            'Label.ConfigCreation.Type.String',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        ),
      },
      {
        value: ValidConfigEntryValueType.Number,
        label: tPendingTranslation(
          'Number',
          'Option label for the number data type when defining a configuration key.',
          translationKey(
            'Label.ConfigCreation.Type.Number',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        ),
      },
      {
        value: ValidConfigEntryValueType.Boolean,
        label: tPendingTranslation(
          'Boolean',
          'Option label for the boolean data type when defining a configuration key.',
          translationKey(
            'Label.ConfigCreation.Type.Boolean',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        ),
      },
      {
        value: ValidConfigEntryValueType.Json,
        label: tPendingTranslation(
          'JSON',
          'Option label for the JSON data type when defining a configuration key.',
          translationKey(
            'Label.ConfigCreation.Type.Json',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        ),
      },
    ];
  }, [tPendingTranslation]);
  const currentTypeLabel = useMemo(() => {
    return typeOptions.find((option) => option.value === overrideType)?.label;
  }, [overrideType, typeOptions]);
  const validateConfigKey = useConfigKeyValidator();
  const validateConfigStringValue = useConfigStringValidator();
  const validateConfigJsonValue = useConfigJsonValidator();
  const validateConfigNumberValue = useConfigNumberValidator();
  const validateConfigBooleanValue = useConfigBooleanValidator();
  const keyValidation = useMemo(() => {
    return validateConfigKey({
      value: configKey,
      errorMessageOverrides: {
        [ValidationError.InvalidConfigKey]: translationKey(
          'Dialog.CreateOrEdit.Error.KeyValidation',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      },
    });
  }, [configKey, validateConfigKey]);
  const hasKeyError = useMemo(() => {
    return !keyValidation.isValid;
  }, [keyValidation.isValid]);
  const shouldShowKeyError = useMemo(() => {
    return hasKeyError && !!configKey;
  }, [configKey, hasKeyError]);
  const keyFieldHelperText = useMemo(() => {
    if (isEditing) {
      return translate(
        translationKey(
          'Dialog.CreateOrEdit.Error.KeyModification',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      );
    }

    if (!keyValidation.isValid && configKey) {
      return keyValidation.message;
    }

    return translate(
      translationKey(
        'Dialog.CreateOrEdit.Error.KeyValidation',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    );
  }, [configKey, isEditing, keyValidation, translate]);
  const valueValidation = useMemo(() => {
    return validateConfigValue({
      overrideType,
      stringValue,
      boolValue,
      validateConfigStringValue,
      validateConfigJsonValue,
      validateConfigNumberValue,
      validateConfigBooleanValue,
    });
  }, [
    boolValue,
    overrideType,
    stringValue,
    validateConfigBooleanValue,
    validateConfigJsonValue,
    validateConfigNumberValue,
    validateConfigStringValue,
  ]);
  const shouldShowValueError = useMemo(() => {
    return shouldShowConfigValueError({ isEditing, valueValidation });
  }, [isEditing, valueValidation]);
  const valueErrorMessage = useMemo(() => {
    if (!valueValidation.isValid && shouldShowValueError) {
      return valueValidation.message;
    }
    return undefined;
  }, [shouldShowValueError, valueValidation]);
  const isFirstStepSubmitDisabled = useMemo(() => {
    return isStepTransitionPending || hasKeyError || !valueValidation.isValid;
  }, [hasKeyError, isStepTransitionPending, valueValidation.isValid]);
  const valueLabel = translate(
    translationKey(
      'Dialog.CreateOrEdit.Label.Value',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const stringValuePlaceholder = translate(
    translationKey(
      'Dialog.CreateOrEdit.Placeholder.String.Value',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const numberValuePlaceholder = translate(
    translationKey(
      'Dialog.CreateOrEdit.Placeholder.Number.Value',
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

  return (
    <div>
      <div className='flex gap-medium items-start margin-bottom-medium'>
        <div className='grow-1 min-width-0'>
          <Controller
            name='configKey'
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                id='config-key'
                size='Large'
                label={translate(
                  translationKey(
                    'Dialog.CreateOrEdit.Label.Key',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                )}
                placeholder={translate(
                  translationKey(
                    'Dialog.CreateOrEdit.Placeholder.String.Key',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                )}
                hasError={shouldShowKeyError}
                error={shouldShowKeyError ? keyFieldHelperText : undefined}
                isDisabled={isEditing || isStepTransitionPending}
                isRequired
              />
            )}
          />
        </div>

        <div className='width-[360px] shrink-0'>
          <Controller
            name='overrideType'
            control={control}
            render={({ field }) => (
              <Dropdown
                className='width-full'
                size='Large'
                label={translate(
                  translationKey(
                    'Dialog.CreateOrEdit.Label.Type',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                )}
                value={field.value}
                isDisabled={isEditing || isStepTransitionPending}
                placeholder={currentTypeLabel ?? ''}
                onValueChange={(value) => field.onChange(value as ValidConfigEntryValueType)}>
                <Menu>
                  {typeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value} title={option.label} />
                  ))}
                </Menu>
              </Dropdown>
            )}
          />
        </div>
      </div>

      <div className='margin-bottom-medium'>
        <ConfigCreationValueInputField
          control={control}
          overrideType={overrideType}
          stringValueName='stringValue'
          boolValueName='boolValue'
          id='config-value'
          label={valueLabel}
          isDisabled={isStepTransitionPending}
          hasError={shouldShowValueError}
          error={valueErrorMessage}
          stringPlaceholder={stringValuePlaceholder}
          numberPlaceholder={numberValuePlaceholder}
          booleanPlaceholder={booleanValuePlaceholder}
          jsonPlaceholder={jsonValuePlaceholder}
        />
      </div>

      <div className='margin-bottom-large'>
        <Controller
          name='description'
          control={control}
          render={({ field }) => (
            <TextArea
              {...field}
              id='config-description'
              rows={4}
              isDisabled={isStepTransitionPending}
              label={translate(
                translationKey(
                  'Dialog.CreateOrEdit.Label.Description',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
              placeholder={translate(
                translationKey(
                  overrideType === ValidConfigEntryValueType.Number
                    ? 'Dialog.CreateOrEdit.Placeholder.Number.Description'
                    : 'Dialog.CreateOrEdit.Placeholder.String.Description',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
            />
          )}
        />
        <div className='margin-top-xsmall text-body-small content-muted'>
          {translate(
            translationKey(
              'Dialog.CreateOrEdit.Helper.Optional',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </div>
      </div>

      <div className='flex gap-small'>
        <Button
          variant='Emphasis'
          type='button'
          isLoading={isStepTransitionPending}
          isDisabled={isFirstStepSubmitDisabled}
          onClick={onNext}>
          {nextButtonLabel}
        </Button>
        <Button
          variant='Standard'
          type='button'
          isDisabled={isStepTransitionPending}
          onClick={onCancel}>
          {translate(
            translationKey(
              'Dialog.CreateOrEdit.Button.Cancel',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </Button>
      </div>
    </div>
  );
};

export default ConfigCreationDefineKeyStep;
