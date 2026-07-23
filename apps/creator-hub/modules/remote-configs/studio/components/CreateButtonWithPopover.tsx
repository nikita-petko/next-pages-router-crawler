import React, { useCallback, useMemo, useState } from 'react';
import {
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Dropdown,
  MenuItem,
  Menu,
  Button,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import { useUniverseResource } from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { useTranslation } from '@rbx/intl';
import strictly from '../foundation-utils/strictly';
import { ValidConfigEntryValueType } from '../../api/universeConfigsClientEnums';
import { foundationClasses } from './useStudioConfigStyles';
import { ValidConfigEntryValue } from '../../api/validTypes';
import useConfigBooleanValidator from '../../hooks/useConfigBooleanValidator';
import useConfigStringValidator from '../../hooks/useConfigStringValidator';
import useConfigJsonValidator from '../../hooks/useConfigJsonValidator';
import useConfigNumberValidator from '../../hooks/useConfigNumberValidator';
import useConfigKeyValidator from '../../hooks/useConfigKeyValidator';
import { useCreateConfigMutation } from '../../hooks/useConfigsActionMutations';
import { ValidationError } from '../../hooks/validatorTypes';
import TextInputForWebview from './TextInputForWebview';

const CreateButton = ({
  onSuccess: onSuccessGiven,
  onClose: onCloseGiven,
}: {
  onSuccess: () => void;
  onClose: () => void;
}) => {
  const { id: universeId } = useUniverseResource();
  const { createConfig, isCreating } = useCreateConfigMutation();
  const { translate } = useTranslationWrapper(useTranslation());

  const [name, setName] = useState('');
  const [type, setType] = useState<ValidConfigEntryValueType | null>(null);
  const [value, setValue] = useState('');

  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => {
    setOpen(false);
    onCloseGiven();
  }, [onCloseGiven]);
  const onSuccess = useCallback(() => {
    onSuccessGiven();
    setName('');
    setType(null);
    setValue('');
    onClose();
  }, [onSuccessGiven, onClose]);
  const entryValue: ValidConfigEntryValue | null = useMemo(() => {
    if (!type) return null;
    switch (type) {
      case ValidConfigEntryValueType.String:
        return { valueType: type, stringValue: value };
      case ValidConfigEntryValueType.Number:
        return { valueType: type, numberValue: parseFloat(value) };
      case ValidConfigEntryValueType.Boolean:
        return { valueType: type, boolValue: value === 'true' };
      case ValidConfigEntryValueType.Json:
        return { valueType: type, jsonValue: value };
      default: {
        const exhaustiveCheck: never = type;
        throw new Error(`Invalid type during creation: ${exhaustiveCheck}`);
      }
    }
  }, [type, value]);

  const onCreate = useCallback(() => {
    if (!type || !entryValue) return;
    createConfig({
      universeId,
      createConfigurationData: {
        entry: { key: name, entryValue },
      },
    })
      .then(onSuccess)
      .catch(onClose);
  }, [type, entryValue, createConfig, universeId, name, onSuccess, onClose]);

  const validateConfigKey = useConfigKeyValidator();
  const validateConfigNumberValue = useConfigNumberValidator();
  const validateConfigBooleanValue = useConfigBooleanValidator();
  const validateConfigJsonValue = useConfigJsonValidator();
  const validateConfigStringValue = useConfigStringValidator();

  const keyValidation = useMemo(
    () =>
      validateConfigKey({
        value: name,
        errorMessageOverrides: {
          [ValidationError.InvalidConfigKey]: translationKey(
            'Dialog.CreateOrEdit.Error.KeyValidation',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        },
      }),
    [name, validateConfigKey],
  );
  const valueValidation = useMemo(() => {
    if (!type) return null;
    switch (type) {
      case ValidConfigEntryValueType.Number:
        return validateConfigNumberValue({ value });
      case ValidConfigEntryValueType.Boolean:
        return validateConfigBooleanValue({ value });
      case ValidConfigEntryValueType.Json:
        return validateConfigJsonValue({ value });
      case ValidConfigEntryValueType.String:
        return validateConfigStringValue({ value });
      default: {
        const exhaustiveCheck: never = type;
        throw new Error(`Invalid type during creation: ${exhaustiveCheck}`);
      }
    }
  }, [
    type,
    validateConfigNumberValue,
    value,
    validateConfigBooleanValue,
    validateConfigJsonValue,
    validateConfigStringValue,
  ]);

  const isFormComplete = keyValidation?.isValid && valueValidation?.isValid;

  const {
    textInput,
    textInputInputContainer,
    createInputLine,
    createDialogContent,
    createLabel,
    createDropdownButtonContainer,
  } = foundationClasses;

  const keyInput = useMemo(() => {
    const isValid = keyValidation?.isValid;
    const showError = !isValid && name !== '';
    const errorMessage = isValid ? null : keyValidation?.message;
    return (
      <div data-testid='name-input' className={createInputLine}>
        <span className={createLabel}>
          {translate(
            translationKey(
              'Dialog.CreateOrEdit.Label.Key',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </span>
        <Tooltip
          open={showError && !!errorMessage}
          title={errorMessage ?? ''}
          position='bottom-end'
          hasBeak>
          <TooltipTrigger asChild>
            <TextInputForWebview
              size='XSmall'
              className={textInput}
              inputContainerClassName={textInputInputContainer}
              value={name}
              hasError={showError}
              isDisabled={isCreating}
              onChange={(e) => setName(e.target.value)}
            />
          </TooltipTrigger>
        </Tooltip>
      </div>
    );
  }, [
    keyValidation,
    name,
    createInputLine,
    createLabel,
    translate,
    textInput,
    textInputInputContainer,
    isCreating,
  ]);

  const valueInput = useMemo(() => {
    const isValid = valueValidation?.isValid;
    const showError = !isValid && !!type && value !== '';
    const errorMessage = isValid ? null : (valueValidation?.message ?? null);
    const inputOrDropdown =
      type === ValidConfigEntryValueType.Boolean ? (
        <Dropdown
          size='XSmall'
          // TODO(gperkins@20251029): Remove inner border on <button>, see createDropdownButtonContainer
          className={createDropdownButtonContainer}
          placeholder={translate(
            translationKey(
              'Dialog.CreateOrEdit.Placeholder.Boolean.Value',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
          value={value || undefined}
          onValueChange={(newValue) => setValue(newValue)}>
          <Menu className={strictly('bg-action-soft-emphasis')}>
            <MenuItem value='true' title='True' />
            <MenuItem value='false' title='False' />
          </Menu>
        </Dropdown>
      ) : (
        <TextInputForWebview
          size='XSmall'
          className={textInput}
          inputContainerClassName={textInputInputContainer}
          value={value}
          hasError={showError}
          isDisabled={isCreating}
          onChange={(e) => setValue(e.target.value)}
        />
      );

    return (
      <div data-testid='value-input' className={createInputLine}>
        <span className={createLabel}>
          {translate(
            translationKey(
              'Dialog.CreateOrEdit.Label.Value',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </span>
        <Tooltip
          open={showError && !!errorMessage}
          title={errorMessage ?? ''}
          position='bottom-end'
          hasBeak>
          <TooltipTrigger asChild>{inputOrDropdown}</TooltipTrigger>
        </Tooltip>
      </div>
    );
  }, [
    valueValidation,
    createDropdownButtonContainer,
    type,
    value,
    textInput,
    textInputInputContainer,
    isCreating,
    createInputLine,
    createLabel,
    translate,
  ]);

  const typePlaceholder = translate(
    translationKey(
      'Dialog.CreateOrEdit.Placeholder.Type',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <IconButton
          size='XSmall'
          icon='icon-filled-plus-large'
          ariaLabel='Create'
          variant='Standard'
        />
      </PopoverTrigger>
      <PopoverContent side='bottom' align='end' ariaLabel='Create'>
        <div data-testid='create-dialog-content' className={createDialogContent}>
          {keyInput}
          <div data-testid='type-input' className={createInputLine}>
            <span className={createLabel}>
              {translate(
                translationKey(
                  'Dialog.CreateOrEdit.Label.Type',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
            </span>
            <Dropdown
              size='XSmall'
              // TODO(gperkins@20251029): Remove inner border on <button>, see createDropdownButtonContainer
              className={createDropdownButtonContainer}
              placeholder={typePlaceholder}
              value={type || undefined}
              isDisabled={isCreating}
              onValueChange={(newType) => setType(newType as ValidConfigEntryValueType)}>
              <Menu className={strictly('bg-action-soft-emphasis')}>
                <MenuItem value={ValidConfigEntryValueType.String} title='String' />
                <MenuItem value={ValidConfigEntryValueType.Number} title='Number' />
                <MenuItem value={ValidConfigEntryValueType.Boolean} title='Boolean' />
                <MenuItem value={ValidConfigEntryValueType.Json} title='JSON' />
              </Menu>
            </Dropdown>
          </div>
          {valueInput}
          <div className={strictly('flex', 'gap-small', 'justify-end')}>
            <Button
              size='XSmall'
              type='button'
              onClick={onClose}
              isDisabled={isCreating}
              variant='Standard'>
              {translate(
                translationKey(
                  'Dialog.CreateOrEdit.Button.Cancel',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
            </Button>
            <Button
              size='XSmall'
              type='button'
              isLoading={isCreating}
              isDisabled={!isFormComplete}
              onClick={onCreate}
              variant='Emphasis'>
              {translate(
                translationKey(
                  'Dialog.CreateOrEdit.Button.Create',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
export default CreateButton;
