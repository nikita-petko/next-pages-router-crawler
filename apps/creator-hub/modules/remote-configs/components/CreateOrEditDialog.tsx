import React, { MouseEventHandler, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  makeStyles,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@rbx/ui';
import { useUniverseResource } from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  InputFieldWrapper,
  CodeEditor,
  CodeEditorSupportedLanguages,
} from '@modules/charts-generic';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { useTranslation } from '@rbx/intl';
import { ValidConfigEntryValueType, ErrorType } from '../api/universeConfigsClientEnums';
import { ValidConfigEntryValue } from '../api/validTypes';
import prettyPrintJson from '../utils/prettyPrintJson';
import useConfigKeyValidator from '../hooks/useConfigKeyValidator';
import useConfigStringValidator from '../hooks/useConfigStringValidator';
import useConfigJsonValidator from '../hooks/useConfigJsonValidator';
import useConfigNumberValidator from '../hooks/useConfigNumberValidator';
import { ValidationError, type ValidationResult } from '../hooks/validatorTypes';
import {
  useCreateConfigMutation,
  useUpdateConfigMutation,
} from '../hooks/useConfigsActionMutations';

export type EditDialogProps = {
  configKey: string;
  priorOverride?: ValidConfigEntryValue;
  initialDescription?: string;
};

export type CreateOrEditResult = null | {
  configKey: string;
  value: ValidConfigEntryValue;
  description?: string;
};

type CreateOrEditDialogProps = {
  open: boolean;
  edit?: EditDialogProps;
  onClose?: (result: CreateOrEditResult) => void;
};

const defaultKeyType: ValidConfigEntryValueType = ValidConfigEntryValueType.String;

const useStyles = makeStyles()((theme) => {
  return {
    fields: {
      margin: theme.spacing(2, 0, 0),
    },
  };
});

const CreateOrEditDialog = ({ open, edit, onClose }: CreateOrEditDialogProps) => {
  const {
    classes: { fields },
  } = useStyles();
  const { translate } = useTranslationWrapper(useTranslation());
  const validateConfigKey = useConfigKeyValidator();
  const validateConfigStringValue = useConfigStringValidator();
  const validateConfigJsonValue = useConfigJsonValidator();
  const validateConfigNumberValue = useConfigNumberValidator();

  const { updateConfig, isUpdating, updateError } = useUpdateConfigMutation();
  const { createConfig, isCreating, createError, lastCreatedKey } = useCreateConfigMutation();

  const [createKey, setCreateKey] = useState<string>('');
  const givenEditKey = edit?.configKey;
  const isEditing = !!givenEditKey;
  const createOrEditKey = isEditing ? givenEditKey : createKey;

  const [description, setDescription] = useState<string>(edit?.initialDescription ?? '');

  const initialValue = edit?.priorOverride;
  const [overrideType, setOverrideType] = useState<ValidConfigEntryValueType>(
    initialValue?.valueType ?? defaultKeyType,
  );
  const [stringValue, setStringValue] = useState<string>(
    prettyPrintJson(initialValue?.jsonValue) ?? initialValue?.stringValue ?? '',
  );
  const numberValue = stringValue ? parseFloat(stringValue) : null;
  const [boolValue, setBoolValue] = useState<boolean>(initialValue?.boolValue ?? true);
  const jsonValue = stringValue;

  const clear = useCallback(() => {
    setCreateKey('');
    setStringValue('');
    setBoolValue(true);
    setDescription('');
  }, []);

  useEffect(() => {
    if (edit) {
      setCreateKey(edit.configKey);
      setOverrideType(initialValue?.valueType ?? defaultKeyType);
      setDescription(edit.initialDescription ?? '');

      // first we set the values to be blank, then we override with the initial value if any
      setBoolValue(true);
      setStringValue('');
      if (initialValue) {
        const { valueType } = initialValue;
        switch (valueType) {
          case ValidConfigEntryValueType.Number:
            setStringValue(initialValue.numberValue.toString());
            break;
          case ValidConfigEntryValueType.Boolean:
            setBoolValue(initialValue.boolValue);
            break;
          case ValidConfigEntryValueType.Json:
            setStringValue(prettyPrintJson(initialValue.jsonValue) ?? '');
            break;
          case ValidConfigEntryValueType.String:
            setStringValue(initialValue.stringValue);
            break;
          default: {
            const exhaustiveCheck: never = valueType;
            throw new Error(`Unexpected value type: ${exhaustiveCheck}`);
          }
        }
      }
    } else {
      clear();
    }
  }, [clear, edit, initialValue]);

  const { id: universeId } = useUniverseResource();

  const onSave = useCallback<MouseEventHandler<HTMLButtonElement>>(
    (ev) => {
      let dialogResult: CreateOrEditResult | null = null;
      switch (overrideType) {
        case ValidConfigEntryValueType.String:
          if (stringValue === null) return;
          dialogResult = {
            configKey: createOrEditKey,
            value: { valueType: overrideType, stringValue },
            description,
          };
          break;
        case ValidConfigEntryValueType.Number: {
          if (numberValue === null) return;
          dialogResult = {
            configKey: createOrEditKey,
            value: { valueType: overrideType, numberValue },
            description,
          };
          break;
        }
        case ValidConfigEntryValueType.Boolean: {
          if (boolValue === null) return;
          dialogResult = {
            configKey: createOrEditKey,
            value: { valueType: overrideType, boolValue },
            description,
          };
          break;
        }
        case ValidConfigEntryValueType.Json:
          if (jsonValue === null) return;
          dialogResult = {
            configKey: createOrEditKey,
            value: { valueType: overrideType, jsonValue },
            description,
          };
          break;
        default: {
          const exhaustiveCheck: never = overrideType;
          throw new Error(`Unexpected override type: ${exhaustiveCheck}`);
        }
      }

      ev.preventDefault();

      // Use create (POST) endpoint if we're creating a new config
      const entry = {
        key: dialogResult.configKey,
        entryValue: dialogResult.value,
        description: dialogResult.description,
      };

      const onSuccess = () => {
        clear();
        onClose?.(dialogResult);
      };

      if (!isEditing) {
        createConfig(
          {
            universeId,
            createConfigurationData: {
              isDeleted: false,
              entry,
            },
          },
          {
            onSuccess,
          },
        );
      } else {
        updateConfig(
          {
            universeId,
            updateConfigurationData: {
              isDeleted: false,
              entry,
            },
          },
          {
            onSuccess,
          },
        );
      }
    },
    [
      boolValue,
      clear,
      createConfig,
      createOrEditKey,
      description,
      isEditing,
      jsonValue,
      numberValue,
      onClose,
      overrideType,
      stringValue,
      updateConfig,
      universeId,
    ],
  );

  const configValueValidationResult: ValidationResult<ValidationError> = useMemo(() => {
    switch (overrideType) {
      case ValidConfigEntryValueType.String:
        return validateConfigStringValue({ value: stringValue });
      case ValidConfigEntryValueType.Json:
        return validateConfigJsonValue({ value: stringValue });
      case ValidConfigEntryValueType.Number:
        return validateConfigNumberValue({ value: stringValue });
      case ValidConfigEntryValueType.Boolean:
        // boolean value is chosen from a dropdown,
        // so we don't need to validate it
        return {
          isValid: true,
        };
      default: {
        const exhaustiveCheck: never = overrideType;
        throw new Error(`Unexpected override type: ${exhaustiveCheck}`);
      }
    }
  }, [
    overrideType,
    stringValue,
    validateConfigJsonValue,
    validateConfigNumberValue,
    validateConfigStringValue,
  ]);

  const creatingExistingKeyError =
    !isEditing &&
    createError?.type === ErrorType.CreateKeyHasOverride &&
    lastCreatedKey === createOrEditKey;

  const isKeyError =
    !validateConfigKey({ value: createOrEditKey }).isValid || creatingExistingKeyError;

  const isAnyFieldChanged = useMemo(() => {
    if (
      description !== (edit?.initialDescription ?? '') ||
      overrideType !== (initialValue?.valueType ?? defaultKeyType)
    ) {
      return true;
    }

    switch (overrideType) {
      case ValidConfigEntryValueType.Json:
        return prettyPrintJson(jsonValue) !== (prettyPrintJson(initialValue?.jsonValue) ?? '');
      case ValidConfigEntryValueType.String:
        return stringValue !== (initialValue?.stringValue ?? '');
      case ValidConfigEntryValueType.Number:
        return numberValue !== initialValue?.numberValue;
      case ValidConfigEntryValueType.Boolean:
        return boolValue !== (initialValue?.boolValue ?? true);
      default: {
        const exhaustiveCheck: never = overrideType;
        throw new Error(`Unexpected override type: ${exhaustiveCheck}`);
      }
    }
  }, [
    description,
    edit?.initialDescription,
    overrideType,
    initialValue,
    jsonValue,
    stringValue,
    numberValue,
    boolValue,
  ]);

  const isDialogError = isKeyError || !configValueValidationResult.isValid;
  const handleJsonBlur = useCallback(
    (value: string | undefined) => {
      const formattedJson = prettyPrintJson(value);
      if (overrideType === ValidConfigEntryValueType.Json && formattedJson) {
        setStringValue(formattedJson);
      } else {
        setStringValue(value ?? '');
      }
    },
    [overrideType],
  );
  const handleJsonChange = useCallback(
    (value: string | undefined) => {
      setStringValue(value ?? '');
    },
    [setStringValue],
  );
  const { keyPlaceholder, valuePlaceholder, descriptionPlaceholder } = useMemo(() => {
    switch (overrideType) {
      case ValidConfigEntryValueType.String:
        return {
          keyPlaceholder: translate(
            translationKey(
              'Dialog.CreateOrEdit.Placeholder.String.Key',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
          valuePlaceholder: translate(
            translationKey(
              'Dialog.CreateOrEdit.Placeholder.String.Value',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
          descriptionPlaceholder: translate(
            translationKey(
              'Dialog.CreateOrEdit.Placeholder.String.Description',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
        };
      case ValidConfigEntryValueType.Number:
        return {
          keyPlaceholder: translate(
            translationKey(
              'Dialog.CreateOrEdit.Placeholder.Number.Key',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
          valuePlaceholder: translate(
            translationKey(
              'Dialog.CreateOrEdit.Placeholder.Number.Value',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
          descriptionPlaceholder: translate(
            translationKey(
              'Dialog.CreateOrEdit.Placeholder.Number.Description',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
        };
      case ValidConfigEntryValueType.Boolean:
        return {
          keyPlaceholder: translate(
            translationKey(
              'Dialog.CreateOrEdit.Placeholder.Boolean.Key',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
          descriptionPlaceholder: translate(
            translationKey(
              'Dialog.CreateOrEdit.Placeholder.Boolean.Description',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
        };
      case ValidConfigEntryValueType.Json:
        return {
          keyPlaceholder: translate(
            translationKey(
              'Dialog.CreateOrEdit.Placeholder.Json.Key',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
          valuePlaceholder: translate(
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
          ),
          descriptionPlaceholder: translate(
            translationKey(
              'Dialog.CreateOrEdit.Placeholder.Json.Description',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
        };
      default: {
        const exhaustiveCheck: never = overrideType;
        throw new Error(`Unexpected override type: ${exhaustiveCheck}`);
      }
    }
  }, [overrideType, translate]);

  const currentValueField = useMemo(() => {
    if (overrideType === ValidConfigEntryValueType.Boolean) {
      return (
        <Select
          fullWidth
          id='valueBoolSelect'
          className={fields}
          variant='outlined'
          data-testid='dialog-value-bool-select'
          label='Value'
          value={boolValue ? 'true' : 'false'}
          onChange={({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
            setBoolValue(value === 'true');
          }}>
          <MenuItem value='true'>True</MenuItem>
          <MenuItem value='false'>False</MenuItem>
        </Select>
      );
    }

    let error = false;
    let helperText: string | undefined;
    // NOTE(gperkins@2025-03-29): String empty value is a dialog error since it's a required field,
    // but we don't want it to show up as a creation value error (DSA-4257)
    if (!configValueValidationResult.isValid && !isEditing) {
      error = configValueValidationResult.error !== ValidationError.EmptyValue;
      helperText = error ? configValueValidationResult.message : undefined;
    } else {
      error = !configValueValidationResult.isValid;
      helperText = !configValueValidationResult.isValid
        ? configValueValidationResult.message
        : undefined;
    }

    if (overrideType === ValidConfigEntryValueType.Json) {
      return (
        <InputFieldWrapper
          id='valueInput'
          data-testid='dialog-value-input'
          className={fields}
          label={translate(
            translationKey(
              'Dialog.CreateOrEdit.Label.Value',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
          error={error}
          helperText={helperText}>
          <CodeEditor
            value={stringValue}
            onChange={handleJsonChange}
            onBlur={handleJsonBlur}
            formatOnBlur
            language={CodeEditorSupportedLanguages.Json}
            height='30vh'
            placeholder={valuePlaceholder}
          />
        </InputFieldWrapper>
      );
    }

    return (
      <TextField
        id='valueInput'
        data-testid='dialog-value-input'
        className={fields}
        variant='outlined'
        value={stringValue || ''}
        fullWidth
        InputLabelProps={{ shrink: true }}
        onChange={({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
          setStringValue(value);
        }}
        label={translate(
          translationKey(
            'Dialog.CreateOrEdit.Label.Value',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}
        placeholder={valuePlaceholder}
        error={error}
        helperText={helperText}
        multiline={overrideType === ValidConfigEntryValueType.String}
        maxRows={12}
      />
    );
  }, [
    overrideType,
    configValueValidationResult,
    isEditing,
    fields,
    stringValue,
    translate,
    valuePlaceholder,
    boolValue,
    handleJsonChange,
    handleJsonBlur,
  ]);

  const currentKeyField = useMemo(() => {
    let keyHelperText = translate(
      translationKey(
        'Dialog.CreateOrEdit.Error.KeyValidation',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    );
    if (isEditing) {
      keyHelperText = translate(
        translationKey(
          'Dialog.CreateOrEdit.Error.KeyModification',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      );
    } else if (creatingExistingKeyError) {
      keyHelperText = translate(
        translationKey(
          'Dialog.CreateOrEdit.Error.KeyExists',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      );
    }
    return (
      <TextField
        id='keyInput'
        data-testid='dialog-key-input'
        className={fields}
        fullWidth
        InputLabelProps={{ shrink: true }}
        variant='outlined'
        value={createOrEditKey}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setCreateKey(e.target.value);
        }}
        label={translate(
          translationKey(
            'Dialog.CreateOrEdit.Label.Key',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}
        helperText={keyHelperText}
        placeholder={keyPlaceholder}
        disabled={isEditing}
        error={isKeyError && !!createOrEditKey}
      />
    );
  }, [
    createOrEditKey,
    creatingExistingKeyError,
    fields,
    isEditing,
    isKeyError,
    keyPlaceholder,
    translate,
  ]);

  const currentTypeField = useMemo(() => {
    const shouldDisableType = isEditing;

    return (
      <Select
        id='typeSelect'
        className={fields}
        data-testid='dialog-type-select'
        variant='outlined'
        value={overrideType}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setOverrideType(e.target.value as ValidConfigEntryValueType)
        }
        disabled={shouldDisableType}
        label={translate(
          translationKey(
            'Dialog.CreateOrEdit.Label.Type',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}>
        <MenuItem value={ValidConfigEntryValueType.String}>String</MenuItem>
        <MenuItem value={ValidConfigEntryValueType.Number}>Number</MenuItem>
        <MenuItem value={ValidConfigEntryValueType.Boolean}>Boolean</MenuItem>
        <MenuItem value={ValidConfigEntryValueType.Json}>JSON</MenuItem>
      </Select>
    );
  }, [isEditing, fields, overrideType, translate]);

  const dialogErrorMessage = useMemo(() => {
    const error = isEditing ? updateError?.type : createError?.type;
    switch (error) {
      case 'unknown':
        return (
          <Typography variant='h6' color='error' sx={{ marginRight: 1 }}>
            {translate(
              translationKey(
                'Error.Unknown',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            )}
          </Typography>
        );
      case 'change-during-publish':
        return (
          <Typography variant='h6' color='error' sx={{ marginRight: 1 }}>
            {translate(
              translationKey(
                'Error.UpdateDuringPublishing',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            )}
          </Typography>
        );
      case ErrorType.ReachedMaxEntries:
        return (
          <Typography variant='h6' color='error' sx={{ marginRight: 1 }}>
            {translate(
              translationKey(
                'Error.ReachedMaxEntries',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
              {
                maxEntries: '1000',
              },
            )}
          </Typography>
        );
      case ErrorType.ConfigLockedByExperiment:
        return (
          <Typography variant='h6' color='error' sx={{ marginRight: 1 }}>
            {translate(
              translationKey(
                'Error.ConfigLockedByExperiment',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            )}
          </Typography>
        );
      default:
        return null;
    }
  }, [createError, isEditing, translate, updateError]);

  const currentDescriptionField = useMemo(() => {
    return (
      <TextField
        id='descriptionInput'
        className={fields}
        fullWidth
        variant='outlined'
        InputLabelProps={{ shrink: true }}
        value={description}
        data-testid='dialog-description-input'
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
        label={translate(
          translationKey(
            'Dialog.CreateOrEdit.Label.Description',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}
        helperText={translate(
          translationKey(
            'Dialog.CreateOrEdit.Helper.Optional',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}
        placeholder={descriptionPlaceholder}
      />
    );
  }, [description, descriptionPlaceholder, fields, translate]);

  const title = translate(
    translationKey(
      isEditing ? 'Dialog.CreateOrEdit.Title.Edit' : 'Dialog.CreateOrEdit.Title.Create',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const confirmText = translate(
    translationKey(
      isEditing ? 'Dialog.CreateOrEdit.Button.Save' : 'Dialog.CreateOrEdit.Button.Create',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const cancelText = translate(
    translationKey(
      'Dialog.CreateOrEdit.Button.Cancel',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const onCancel = useCallback(() => {
    onClose?.(null);
  }, [onClose]);
  const id = isEditing ? 'edit-config-dialog' : 'create-config-dialog';
  return (
    <Dialog open={open} fullWidth maxWidth='Medium' onClose={onCancel}>
      <DialogTitle id={id} data-testid='dialog-title' data-isopen={open}>
        {title}
      </DialogTitle>
      <DialogContent>
        <Grid container direction='row' spacing={2}>
          <Grid item flex={1}>
            {currentKeyField}
          </Grid>
          <Grid item>{currentTypeField}</Grid>
        </Grid>
        {currentValueField}
        {currentDescriptionField}
      </DialogContent>
      <DialogActions>
        {dialogErrorMessage}
        <Button
          size='large'
          variant='outlined'
          aria-label={cancelText}
          data-testid='dialog-cancel-button'
          color='secondary'
          onClick={onCancel}
          disabled={isUpdating || isCreating}>
          {cancelText}
        </Button>
        <Button
          size='large'
          variant='contained'
          loading={isUpdating || isCreating}
          aria-label={confirmText}
          data-testid='dialog-submit-button'
          data-loading={isUpdating || isCreating}
          color='primaryBrand'
          onClick={onSave}
          disabled={isUpdating || isCreating || isDialogError || !isAnyFieldChanged}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default CreateOrEditDialog;
